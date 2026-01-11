from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)

@router.delete("/{message_id}")
def delete_message(message_id: str, db: Session = Depends(get_db)):
    db_message = crud.delete_message(db, message_id=message_id)
    if db_message is None:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True}

@router.post("/batch_delete")
def delete_messages(message_ids: List[str], db: Session = Depends(get_db)):
    crud.delete_messages(db, message_ids=message_ids)
    return {"ok": True}
