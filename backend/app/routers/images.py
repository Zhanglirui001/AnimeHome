from fastapi import APIRouter, HTTPException, Response, UploadFile, File
from fastapi.responses import JSONResponse
import requests
import os
import shutil
import uuid

router = APIRouter(
    prefix="/proxy",
    tags=["proxy"]
)

# Upload router (we can move this to a separate file or keep here)
upload_router = APIRouter(
    prefix="/upload",
    tags=["upload"]
)

@upload_router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
            
        # Create unique filename
        file_ext = os.path.splitext(file.filename)[1]
        if not file_ext:
             # Default extension if missing
            content_type_map = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/gif": ".gif",
                "image/webp": ".webp",
                "image/svg+xml": ".svg"
            }
            file_ext = content_type_map.get(file.content_type, ".png")
            
        filename = f"{uuid.uuid4()}{file_ext}"
        
        # Define path
        # Assuming backend is running from backend/ directory or we find path relative to this file
        # This file is in backend/app/routers/images.py
        # We want backend/static/avatars
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        save_dir = os.path.join(base_dir, "static", "avatars")
        os.makedirs(save_dir, exist_ok=True)
        
        file_path = os.path.join(save_dir, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return URL
        # Assuming localhost:8000 for now, ideally use a config
        # But we can return a relative path or full path if we know the domain
        # For local dev, we return full URL
        url = f"http://localhost:8000/static/avatars/{filename}"
        
        return JSONResponse(content={"url": url})
        
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image")
async def proxy_image(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="Missing URL parameter")

    try:
        # Fetch image with headers to mimic a browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            # Some sites check Referer, we can set it to the origin of the image or empty
            "Referer": url, 
        }
        
        response = requests.get(url, headers=headers, stream=True, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch image")

        content_type = response.headers.get("Content-Type", "application/octet-stream")

        return Response(content=response.content, media_type=content_type)

    except Exception as e:
        print(f"Proxy error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
