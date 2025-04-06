from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.database import get_db
from schemas.teacher import TeacherCreate, Teacher
from models.teacher import Teacher as TeacherModel


router = APIRouter()

# create teacher
@router.post("/teachers/", response_model=Teacher)
async def create_teacher(teacher: TeacherCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_teacher = TeacherModel(name=teacher.name, age=teacher.age,created_at=teacher.created_at)
        db.add(db_teacher)
        await db.commit()
        await db.refresh(db_teacher)
        return db_teacher
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
      
      
# read teachers
@router.get("/teachers/", response_model=list[Teacher])
async def read_teachers(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(TeacherModel))
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# read teacher by id
@router.get("/teachers/{teacher_id}", response_model=Teacher)
async def read_teacher(teacher_id: int, db: AsyncSession = Depends(get_db)):
  try:
    result = await db.execute(select(TeacherModel).where(TeacherModel.id == teacher_id))
    return result.scalars().first()
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
                
      
# update teacher
# delete teacher