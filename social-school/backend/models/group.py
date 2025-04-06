from database.database import Base
from sqlalchemy import Column, Integer, String

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(String)
    updated_at = Column(String)
    deleted_at = Column(String)
    students = relationship("Student", back_populates="group")
    teachers = relationship("Teacher", back_populates="group")
    