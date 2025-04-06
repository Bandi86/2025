from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.database import get_db
from schemas.student import StudentCreate, Student
from models.student import Student as StudentModel

router = APIRouter()

# create student
@router.post("/students/", response_model=Student)
async def create_student(student: StudentCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_student = StudentModel(name=student.name, age=student.age,group_id=student.group_id,created_at=student.created_at)
        db.add(db_student)
        await db.commit()
        await db.refresh(db_student)
        return db_student
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# read students
@router.get("/students/", response_model=list[Student])
async def read_students(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(StudentModel))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# read student by id
@router.get("/students/{student_id}", response_model=Student)
async def read_student(student_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(StudentModel).where(StudentModel.id == student_id))
        return result.scalars().first()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# update student
    
# delete student    
    