from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class GoogleAuthRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_google: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class QuestionSchema(BaseModel):
    id: Optional[str] = None
    subject: str
    module: int
    topic: str
    text: str
    marks: int
    bloomLevel: int
    bloomLevelAI: int
    courseOutcome: str
    questionType: str
    isDuplicate: Optional[bool] = False
    duplicateOf: Optional[str] = None

    class Config:
        from_attributes = True
