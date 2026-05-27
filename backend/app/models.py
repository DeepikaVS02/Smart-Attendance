from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    bluetooth_id = Column(String, unique=True, index=True, nullable=False)

    attendance_records = relationship("Attendance", back_populates="student")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    attendance_records = relationship("Attendance", back_populates="session")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    date = Column(String, nullable=False)  # Format: YYYY-MM-DD
    time = Column(String, nullable=False)  # Format: HH:MM:SS

    student = relationship("Student", back_populates="attendance_records")
    session = relationship("Session", back_populates="attendance_records")
