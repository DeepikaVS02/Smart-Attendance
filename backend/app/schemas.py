from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None

# Student
class StudentBase(BaseModel):
    id: str
    name: str
    bluetooth_id: str

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    class Config:
        from_attributes = True

# Session
class SessionBase(BaseModel):
    start_time: datetime
    end_time: datetime
    is_active: bool

class SessionCreate(SessionBase):
    pass

class Session(SessionBase):
    id: int
    class Config:
        from_attributes = True

# Attendance
class AttendanceCreate(BaseModel):
    studentId: str  # Can be student.id or student.bluetooth_id

class AttendanceResponse(BaseModel):
    id: int
    student_id: str
    student_name: str
    bluetooth_id: str
    session_id: int
    date: str
    time: str

    class Config:
        from_attributes = True

# Stats
class StatsResponse(BaseModel):
    total_students: int
    present_today: int
    absent_today: int
    attendance_rate: float
