from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# --- Message Schemas ---
class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    id: str  # Client generates UUID
    character_id: Optional[int] = None # Optional in body, set by router from URL

class Message(MessageBase):
    id: str
    character_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Character Schemas ---
class ExampleDialogue(BaseModel):
    user: str
    assistant: str

class CharacterBase(BaseModel):
    name: str
    avatar: Optional[str] = None
    description: Optional[str] = None
    system_prompt: str
    tags: List[str] = []
    first_message: Optional[str] = None
    examples: List[ExampleDialogue] = []

class CharacterCreate(CharacterBase):
    pass

class CharacterUpdate(CharacterBase):
    pass

class Character(CharacterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Chat Request Schema ---
class ChatRequest(BaseModel):
    messages: List[MessageBase]
    systemPrompt: Optional[str] = None
