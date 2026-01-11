from sqlalchemy.orm import Session
from . import models, schemas
import json

# --- Character CRUD ---
def get_character(db: Session, character_id: int):
    return db.query(models.Character).filter(models.Character.id == character_id).first()

def get_characters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Character).offset(skip).limit(limit).all()

def create_character(db: Session, character: schemas.CharacterCreate):
    db_character = models.Character(
        name=character.name,
        avatar=character.avatar,
        description=character.description,
        system_prompt=character.system_prompt,
        tags=character.tags,
        first_message=character.first_message,
        examples=[ex.dict() for ex in character.examples]
    )
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

def update_character(db: Session, character_id: int, character: schemas.CharacterUpdate):
    db_character = get_character(db, character_id)
    if not db_character:
        return None
    
    for key, value in character.dict().items():
        setattr(db_character, key, value)
    
    db.commit()
    db.refresh(db_character)
    return db_character

def delete_character(db: Session, character_id: int):
    db_character = get_character(db, character_id)
    if db_character:
        db.delete(db_character)
        db.commit()
    return db_character

# --- Message CRUD ---
def get_messages(db: Session, character_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Message)\
        .filter(models.Message.character_id == character_id)\
        .order_by(models.Message.created_at)\
        .offset(skip)\
        .limit(limit)\
        .all()

def create_message(db: Session, message: schemas.MessageCreate):
    db_message = models.Message(
        id=message.id,
        character_id=message.character_id,
        role=message.role,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def delete_message(db: Session, message_id: str):
    db_message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if db_message:
        db.delete(db_message)
        db.commit()
    return db_message

def delete_messages(db: Session, message_ids: list[str]):
    # Bulk delete
    db.query(models.Message).filter(models.Message.id.in_(message_ids)).delete(synchronize_session=False)
    db.commit()
    return True
