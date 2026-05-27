from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models, schemas

# Student operations
def get_student_by_id(db: Session, student_id: str):
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_by_bluetooth_id(db: Session, bluetooth_id: str):
    return db.query(models.Student).filter(models.Student.bluetooth_id == bluetooth_id).first()

def get_all_students(db: Session):
    return db.query(models.Student).all()

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(
        id=student.id,
        name=student.name,
        bluetooth_id=student.bluetooth_id
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

# Session operations
def get_active_session(db: Session):
    session = db.query(models.Session).filter(models.Session.is_active == True).first()
    if session:
        # Check if the session has expired (5-minute limit)
        if datetime.now() > session.end_time:
            session.is_active = False
            db.commit()
            return None
        return session
    return None

def start_new_session(db: Session, duration_minutes: int = 5):
    # Deactivate any currently active sessions first
    db.query(models.Session).filter(models.Session.is_active == True).update({"is_active": False})
    db.commit()

    start_time = datetime.now()
    end_time = start_time + timedelta(minutes=duration_minutes)
    
    db_session = models.Session(
        start_time=start_time,
        end_time=end_time,
        is_active=True
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def stop_active_session(db: Session):
    active_session = get_active_session(db)
    if active_session:
        active_session.is_active = False
        db.commit()
        db.refresh(active_session)
        return active_session
    return None

# Attendance operations
def mark_attendance(db: Session, student_id: str, session_id: int):
    # Check if attendance is already marked for this student in this session
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.session_id == session_id
    ).first()
    
    if existing:
        return existing
        
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    
    db_attendance = models.Attendance(
        student_id=student_id,
        session_id=session_id,
        date=date_str,
        time=time_str
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_session_attendance_details(db: Session, session_id: int):
    results = db.query(
        models.Attendance.id,
        models.Attendance.student_id,
        models.Student.name.label("student_name"),
        models.Student.bluetooth_id,
        models.Attendance.session_id,
        models.Attendance.date,
        models.Attendance.time
    ).join(
        models.Student, models.Attendance.student_id == models.Student.id
    ).filter(
        models.Attendance.session_id == session_id
    ).order_by(models.Attendance.time.desc()).all()
    
    return results

def get_all_attendance_details(db: Session):
    results = db.query(
        models.Attendance.id,
        models.Attendance.student_id,
        models.Student.name.label("student_name"),
        models.Student.bluetooth_id,
        models.Attendance.session_id,
        models.Attendance.date,
        models.Attendance.time
    ).join(
        models.Student, models.Attendance.student_id == models.Student.id
    ).order_by(models.Attendance.session_id.desc(), models.Attendance.time.desc()).all()
    
    return results

# Stats helper
def get_session_stats(db: Session, session_id: int):
    total_students = db.query(models.Student).count()
    present_students = db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).count()
    
    absent_students = max(0, total_students - present_students)
    rate = (present_students / total_students * 100) if total_students > 0 else 0.0
    
    return {
        "total_students": total_students,
        "present_today": present_students,
        "absent_today": absent_students,
        "attendance_rate": round(rate, 2)
    }

# Seeding
def seed_students(db: Session):
    # Check if we already have students
    if db.query(models.Student).count() > 0:
        return
        
    initial_students = [
        {"id": "S1001", "name": "Alice Smith", "bluetooth_id": "student-alice"},
        {"id": "S1002", "name": "Bob Jones", "bluetooth_id": "student-bob"},
        {"id": "S1003", "name": "Charlie Brown", "bluetooth_id": "student-charlie"},
        {"id": "S1004", "name": "David Davis", "bluetooth_id": "student-david"},
        {"id": "S1005", "name": "Eva Green", "bluetooth_id": "student-eva"},
        {"id": "S1006", "name": "Frank White", "bluetooth_id": "student-frank"},
        {"id": "S1007", "name": "Grace Miller", "bluetooth_id": "student-grace"},
        {"id": "S1008", "name": "Henry Wilson", "bluetooth_id": "student-henry"},
        {"id": "S1009", "name": "Ivy Taylor", "bluetooth_id": "student-ivy"},
        {"id": "S1010", "name": "Jack Evans", "bluetooth_id": "student-jack"},
    ]
    
    for s in initial_students:
        db_student = models.Student(
            id=s["id"],
            name=s["name"],
            bluetooth_id=s["bluetooth_id"]
        )
        db.add(db_student)
    db.commit()
