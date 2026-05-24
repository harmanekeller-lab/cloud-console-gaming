"""FastAPI entrypoint — signaling, sessions, webhooks."""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import session, signaling, webhook


async def reaper_task():
    while True:
        await asyncio.sleep(30)
        dead = session.reap_dead_sessions()
        for sid in dead:
            try:
                await session.stop_internal(sid, reason="heartbeat_timeout")
                print(f"[reaper] killed dead session {sid}")
            except Exception as e:
                print(f"[reaper] {sid}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(reaper_task())
    yield
    task.cancel()


app = FastAPI(title="CloudGaming Backend", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(session.router)
app.include_router(signaling.router)
app.include_router(webhook.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
