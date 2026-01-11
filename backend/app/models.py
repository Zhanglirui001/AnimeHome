from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    avatar = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)
    tags = Column(JSON, nullable=True)  # Stored as JSON array
    first_message = Column(Text, nullable=True)
    examples = Column(JSON, nullable=True)  # Stored as JSON array of objects
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="character", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True)  # UUID string
    character_id = Column(Integer, ForeignKey("characters.id"))
    role = Column(String(50), nullable=False)  # system, user, assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="messages")
