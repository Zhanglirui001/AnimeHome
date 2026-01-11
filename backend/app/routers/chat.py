from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from openai import OpenAI
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas

load_dotenv()

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

# Initialize OpenAI client for Qwen (Aliyun)
client = OpenAI(
    api_key=os.getenv("MODEL_API_KEY"),
    base_url=os.getenv("MODEL_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    systemPrompt: Optional[str] = None
    character_id: Optional[int] = None # Receive character_id to save messages

@router.post("/")
async def chat_completion(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # Construct messages list
        messages = []
        if request.systemPrompt:
            messages.append({"role": "system", "content": request.systemPrompt})
        
        for msg in request.messages:
            messages.append({"role": msg.role, "content": msg.content})

        print(f"--- Incoming Request ---")
        print(f"System Prompt: {request.systemPrompt}")
        print(f"Messages: {messages}")
        print(f"Character ID: {request.character_id}")
        print(f"------------------------")

        # Create stream
        print(f"Calling Qwen API ({os.getenv('MODEL_NAME', 'qwen-max')})...")
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "qwen-max"),
            messages=messages,
            temperature=float(os.getenv("MODEL_TEMPERATURE", 0.7)),
            stream=True,
        )

        # Generator function for streaming
        def generate():
            print("Start streaming response...")
            full_content = ""
            import json
            try:
                for chunk in response:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        full_content += content
                        # Format as Vercel AI Data Stream Protocol (0: "text_chunk"\n)
                        yield f'0:{json.dumps(content)}\n'
            except Exception as stream_err:
                print(f"Streaming Error: {stream_err}")
                raise stream_err
            finally:
                print(f"Full Response: {full_content}")
                print("End streaming.")
                
                # Save assistant message if character_id is present
                if request.character_id:
                    import uuid
                    try:
                        # We need a new session here because the generator runs outside the request context?
                        # Actually, using the passed db session inside a generator that runs after the response starts might be tricky 
                        # if the session is closed.
                        # For simplicity, we can try to use a new session or the existing one if it's still open.
                        # Better approach: Create a new session just for saving.
                        from ..database import SessionLocal
                        save_db = SessionLocal()
                        try:
                            assistant_msg = schemas.MessageCreate(
                                id=str(uuid.uuid4()),
                                character_id=request.character_id,
                                role="assistant",
                                content=full_content
                            )
                            crud.create_message(save_db, assistant_msg)
                            print(f"Saved assistant message to DB: {assistant_msg.id}")
                        except Exception as save_err:
                            print(f"Error saving message to DB: {save_err}")
                        finally:
                            save_db.close()
                    except Exception as e:
                        print(f"DB Error wrapper: {e}")

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        print(f"Error in chat_completion: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
