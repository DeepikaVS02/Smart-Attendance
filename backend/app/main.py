import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from . import models, schemas, crud
from .database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Bluetooth Attendance System API",
    description="Backend API for BLE proximity-based attendance tracking",
    version="1.0.0"
)

# Configure CORS
# In production: set ALLOWED_ORIGINS env var to your Render frontend URL
# e.g. ALLOWED_ORIGINS="https://smart-attendance.onrender.com"
# In development: defaults to allow all origins
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",")] if raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to seed student data
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        crud.seed_students(db)
        print("Database seeded with default students.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

# Auth Endpoint
@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(request: schemas.LoginRequest):
    # Simple teacher authentication
    if request.username == "admin" and request.password == "admin":
        return {
            "success": True,
            "message": "Login successful",
            "token": "mock-jwt-token-for-teacher"
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password"
    )

# Session Endpoints
@app.post("/api/session/start", response_model=schemas.Session)
def start_session(db: Session = Depends(get_db)):
    try:
        session = crud.start_new_session(db)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/session/stop")
def stop_session(db: Session = Depends(get_db)):
    session = crud.stop_active_session(db)
    if not session:
        raise HTTPException(status_code=400, detail="No active session to stop")
    return {"success": True, "message": "Session stopped", "session_id": session.id}

@app.get("/api/session/active")
def get_active_session(db: Session = Depends(get_db)):
    session = crud.get_active_session(db)
    if not session:
        return {"active": False, "session": None}
    
    # Calculate time remaining
    remaining = (session.end_time - datetime.now()).total_seconds()
    return {
        "active": True,
        "session": {
            "id": session.id,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat(),
            "time_remaining_seconds": max(0, int(remaining))
        }
    }

# Attendance Endpoints
@app.post("/api/mark-attendance")
def mark_attendance(request: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    active_session = crud.get_active_session(db)
    if not active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active session. Attendance can only be marked during a session."
        )
        
    student_id = request.studentId
    
    # Find student by ID or by Bluetooth ID
    student = crud.get_student_by_id(db, student_id)
    if not student:
        student = crud.get_student_by_bluetooth_id(db, student_id)
        
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID/Bluetooth ID '{student_id}' not found in roster."
        )
        
    # Mark attendance (crud prevents duplicates)
    record = crud.mark_attendance(db, student.id, active_session.id)
    
    return {
        "success": True,
        "message": f"Attendance marked for {student.name}",
        "attendance": {
            "id": record.id,
            "student_id": student.id,
            "student_name": student.name,
            "bluetooth_id": student.bluetooth_id,
            "session_id": record.session_id,
            "date": record.date,
            "time": record.time
        }
    }

@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(session_id: Optional[int] = None, db: Session = Depends(get_db)):
    target_session_id = session_id
    
    if not target_session_id:
        active_sess = crud.get_active_session(db)
        if active_sess:
            target_session_id = active_sess.id
        else:
            # Try to get the latest session
            latest = db.query(models.Session).order_by(models.Session.id.desc()).first()
            if latest:
                target_session_id = latest.id
                
    if not target_session_id:
        # No session exists yet, return empty stats
        total = db.query(models.Student).count()
        return {
            "total_students": total,
            "present_today": 0,
            "absent_today": total,
            "attendance_rate": 0.0
        }
        
    stats = crud.get_session_stats(db, target_session_id)
    return stats

@app.get("/api/students", response_model=List[schemas.Student])
def get_students(db: Session = Depends(get_db)):
    return crud.get_all_students(db)

@app.get("/api/attendance", response_model=List[schemas.AttendanceResponse])
def get_attendance(session_id: Optional[int] = None, db: Session = Depends(get_db)):
    if session_id:
        records = crud.get_session_attendance_details(db, session_id)
    else:
        # If no session ID provided, try active session first
        active_sess = crud.get_active_session(db)
        if active_sess:
            records = crud.get_session_attendance_details(db, active_sess.id)
        else:
            # Fall back to all attendance logs
            records = crud.get_all_attendance_details(db)
            
    # Map results to schemas
    return [
        schemas.AttendanceResponse(
            id=r.id,
            student_id=r.student_id,
            student_name=r.student_name,
            bluetooth_id=r.bluetooth_id,
            session_id=r.session_id,
            date=r.date,
            time=r.time
        ) for r in records
    ]

# Manual seed trigger endpoint
@app.post("/api/seed")
def force_seed(db: Session = Depends(get_db)):
    crud.seed_students(db)
    return {"success": True, "message": "Database seeded successfully."}
