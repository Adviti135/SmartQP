from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from datetime import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_google = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuestionModel(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, index=True)
    subject = Column(String, index=True, nullable=False)
    module = Column(Integer, index=True, nullable=False)
    topic = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    marks = Column(Integer, nullable=False)
    bloom_level = Column(Integer, nullable=False)
    bloom_level_ai = Column(Integer, nullable=False)
    course_outcome = Column(String, nullable=False)
    question_type = Column(String, nullable=False)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of = Column(String, nullable=True)
