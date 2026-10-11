import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import engine, Base, get_db
from backend.models import User, QuestionModel
from backend.schemas import (
    UserRegister,
    UserLogin,
    GoogleAuthRequest,
    UserResponse,
    TokenResponse,
    QuestionSchema,
)
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    verify_google_id_token,
    get_current_user,
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartQP API", version="1.0.0")

# Enable CORS for frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SmartQP API", "status": "active"}

# AUTH ENDPOINTS

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(req: UserRegister, db: Session = Depends(get_db)):
    # Check for duplicate email or username
    existing_email = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
    
    existing_username = db.query(User).filter(User.username == req.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken. Please choose another.",
        )
    
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long.",
        )

    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    hashed_pwd = hash_password(req.password)
    
    user = User(
        id=user_id,
        username=req.username,
        email=req.email.lower(),
        hashed_password=hashed_pwd,
        is_google=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(req: UserLogin, db: Session = Depends(get_db)):
    identifier = req.username_or_email.strip().lower()
    
    # Match email or username
    user = db.query(User).filter(
        (User.email == identifier) | (User.username == req.username_or_email)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
        )

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))

@app.post("/api/auth/google", response_model=TokenResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    # Perform backend verification of the Google ID Token
    google_data = verify_google_id_token(req.id_token)
    
    email = google_data.get("email", "").lower()
    name = google_data.get("name") or google_data.get("given_name") or email.split("@")[0]
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google profile data: email missing.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Register new user from verified Google credentials
        user_id = f"usr_g_{uuid.uuid4().hex[:8]}"
        user = User(
            id=user_id,
            username=name,
            email=email,
            hashed_password=hash_password(uuid.uuid4().hex), # Salted dummy hash
            is_google=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    return TokenResponse(access_token=token, user=UserResponse.from_orm(user))

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

# SUBJECTS ENDPOINT

@app.get("/api/subjects")
def get_subjects():
    return [
        {"id": "ds", "name": "Data Structures"},
        {"id": "os", "name": "Operating Systems"},
    ]

# QUESTION BANK ENDPOINTS

@app.get("/api/questions", response_model=List[QuestionSchema])
def get_questions(
    subject: Optional[str] = None,
    module: Optional[int] = None,
    marks: Optional[int] = None,
    bloomLevel: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(QuestionModel)
    if subject:
        query = query.filter(QuestionModel.subject == subject)
    if module:
        query = query.filter(QuestionModel.module == module)
    if marks:
        query = query.filter(QuestionModel.marks == marks)
    if bloomLevel:
        query = query.filter(QuestionModel.bloom_level == bloomLevel)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            QuestionModel.text.ilike(s) | QuestionModel.topic.ilike(s)
        )
    
    questions = query.all()
    # Map snake_case db model to camelCase schema
    res = []
    for q in questions:
        res.append(QuestionSchema(
            id=q.id,
            subject=q.subject,
            module=q.module,
            topic=q.topic,
            text=q.text,
            marks=q.marks,
            bloomLevel=q.bloom_level,
            bloomLevelAI=q.bloom_level_ai,
            courseOutcome=q.course_outcome,
            questionType=q.question_type,
            isDuplicate=q.is_duplicate,
            duplicateOf=q.duplicate_of,
        ))
    return res

@app.post("/api/questions", response_model=QuestionSchema)
def create_question(data: QuestionSchema, db: Session = Depends(get_db)):
    q_id = data.id or f"q_{uuid.uuid4().hex[:8]}"
    model = QuestionModel(
        id=q_id,
        subject=data.subject,
        module=data.module,
        topic=data.topic,
        text=data.text,
        marks=data.marks,
        bloom_level=data.bloomLevel,
        bloom_level_ai=data.bloomLevelAI,
        course_outcome=data.courseOutcome,
        question_type=data.questionType,
        is_duplicate=data.isDuplicate or False,
        duplicate_of=data.duplicateOf,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return QuestionSchema(
        id=model.id,
        subject=model.subject,
        module=model.module,
        topic=model.topic,
        text=model.text,
        marks=model.marks,
        bloomLevel=model.bloom_level,
        bloomLevelAI=model.bloom_level_ai,
        courseOutcome=model.course_outcome,
        questionType=model.question_type,
        isDuplicate=model.is_duplicate,
        duplicateOf=model.duplicate_of,
    )

@app.put("/api/questions/{question_id}", response_model=QuestionSchema)
def update_question(question_id: str, data: dict, db: Session = Depends(get_db)):
    q = db.query(QuestionModel).filter(QuestionModel.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    if "subject" in data: q.subject = data["subject"]
    if "module" in data: q.module = data["module"]
    if "topic" in data: q.topic = data["topic"]
    if "text" in data: q.text = data["text"]
    if "marks" in data: q.marks = data["marks"]
    if "bloomLevel" in data: q.bloom_level = data["bloomLevel"]
    if "bloomLevelAI" in data: q.bloom_level_ai = data["bloomLevelAI"]
    if "courseOutcome" in data: q.course_outcome = data["courseOutcome"]
    if "questionType" in data: q.question_type = data["questionType"]
    
    db.commit()
    db.refresh(q)
    return QuestionSchema(
        id=q.id,
        subject=q.subject,
        module=q.module,
        topic=q.topic,
        text=q.text,
        marks=q.marks,
        bloomLevel=q.bloom_level,
        bloomLevelAI=q.bloom_level_ai,
        courseOutcome=q.course_outcome,
        questionType=q.question_type,
        isDuplicate=q.is_duplicate,
        duplicateOf=q.duplicate_of,
    )

@app.delete("/api/questions/{question_id}")
def delete_question(question_id: str, db: Session = Depends(get_db)):
    q = db.query(QuestionModel).filter(QuestionModel.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully"}

@app.delete("/api/questions")
def delete_all_questions(db: Session = Depends(get_db)):
    db.query(QuestionModel).delete()
    db.commit()
    return {"message": "All questions deleted"}
