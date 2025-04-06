from database.database import Base
from sqlalchemy import Column, Integer, String

class Teachers(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)    
    created_at = Column(String)
    updated_at = Column(String)
    deleted_at = Column(String)