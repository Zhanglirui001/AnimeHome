from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/characters",
    tags=["characters"]
)

@router.post("/", response_model=schemas.Character)
def create_character(character: schemas.CharacterCreate, db: Session = Depends(get_db)):
    return crud.create_character(db=db, character=character)

@router.get("/", response_model=List[schemas.Character])
def read_characters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_characters(db, skip=skip, limit=limit)

@router.get("/{character_id}", response_model=schemas.Character)
def read_character(character_id: int, db: Session = Depends(get_db)):
    db_character = crud.get_character(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@router.put("/{character_id}", response_model=schemas.Character)
def update_character(character_id: int, character: schemas.CharacterUpdate, db: Session = Depends(get_db)):
    db_character = crud.update_character(db, character_id=character_id, character=character)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@router.delete("/{character_id}")
def delete_character(character_id: int, db: Session = Depends(get_db)):
    db_character = crud.delete_character(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return {"ok": True}

@router.get("/{character_id}/messages", response_model=List[schemas.Message])
def read_messages(character_id: int, db: Session = Depends(get_db)):
    return crud.get_messages(db, character_id=character_id)

@router.post("/{character_id}/messages", response_model=schemas.Message)
def create_message(character_id: int, message: schemas.MessageCreate, db: Session = Depends(get_db)):
    # Ensure character exists
    db_character = crud.get_character(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Overwrite character_id from path
    message.character_id = character_id
    return crud.create_message(db, message)
