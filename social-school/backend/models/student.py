from database.database import Base
from sqlalchemy import Column, Integer, String


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)    
    created_at = Column(String)
    updated_at = Column(String)
    deleted_at = Column(String)
