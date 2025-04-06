from fastapi import FastAPI

from routers.student import router
from database.database import init_db

app = FastAPI()
app.include_router(router)

@app.on_event("startup")
async def on_startup():
    await init_db()

@app.get("/")
def read_root():
    return {"Hello": "Bandi"}


