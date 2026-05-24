"""Session lifecycle: start, heartbeat, stop. JWT-protected."""
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..auth import CurrentUser
from ..services import supabase as sb, runpod as rp

router = APIRouter(prefix="/session", tags=["session"])

# In-memory heartbeat tracker: session_id -> last_ts
HEARTBEATS: dict[str, float] = {}
HEARTBEAT_TIMEOUT = 180  # 3 min


class StartReq(BaseModel):
    game_id: str


@router.post("/start")
async def start(req: StartReq, user=CurrentUser):
    uid = user["sub"]
    if sb.get_balance_seconds(uid) < 60:
        raise HTTPException(402, "Insufficient time balance")
    session = sb.create_session(uid, req.game_id)
    try:
        pod = await rp.start_pod(name=f"sess-{session['id'][:8]}")
        pod_id = pod.get("data", {}).get("podFindAndDeployOnDemand", {}).get("id")
        sb.set_session_status(session["id"], "starting", worker_id=pod_id)
        HEARTBEATS[session["id"]] = time.time()
        return {"session_id": session["id"], "worker_id": pod_id, "status": "starting"}
    except Exception as e:
        sb.set_session_status(session["id"], "failed")
        raise HTTPException(500, f"Failed to provision worker: {e}")


class HeartbeatReq(BaseModel):
    session_id: str
    elapsed_seconds: int  # since last heartbeat (client-reported, capped server-side)


@router.post("/heartbeat")
async def heartbeat(req: HeartbeatReq, user=CurrentUser):
    uid = user["sub"]
    delta = max(0, min(req.elapsed_seconds, 120))  # cap at 2 min to prevent abuse
    new_balance = sb.deduct_seconds(uid, delta)
    HEARTBEATS[req.session_id] = time.time()
    if new_balance == 0:
        await stop_internal(req.session_id, reason="time_exhausted")
    return {"balance_seconds": new_balance}


class StopReq(BaseModel):
    session_id: str


@router.post("/stop")
async def stop(req: StopReq, user=CurrentUser):
    await stop_internal(req.session_id, reason="user_stop")
    return {"ok": True}


async def stop_internal(session_id: str, reason: str) -> None:
    res = sb.supabase.table("sessions").select("worker_id").eq("id", session_id).single().execute()
    worker_id = (res.data or {}).get("worker_id")
    if worker_id:
        try:
            await rp.stop_pod(worker_id)
        except Exception as e:
            print(f"[stop] runpod stop failed: {e}")
    sb.set_session_status(session_id, "ended", end_reason=reason)
    HEARTBEATS.pop(session_id, None)


def reap_dead_sessions() -> list[str]:
    """Called periodically: kill sessions with stale heartbeat."""
    now = time.time()
    dead = [sid for sid, ts in HEARTBEATS.items() if now - ts > HEARTBEAT_TIMEOUT]
    return dead
