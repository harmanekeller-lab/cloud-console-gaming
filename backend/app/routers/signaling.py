"""WebRTC signaling — relays SDP/ICE between browser and GPU worker."""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# session_id -> {"browser": ws, "worker": ws}
ROOMS: dict[str, dict[str, WebSocket]] = {}
LOCK = asyncio.Lock()


async def _relay(session_id: str, role: str, ws: WebSocket) -> None:
    async with LOCK:
        ROOMS.setdefault(session_id, {})[role] = ws
    peer_role = "worker" if role == "browser" else "browser"
    try:
        while True:
            msg = await ws.receive_text()
            peer = ROOMS.get(session_id, {}).get(peer_role)
            if peer:
                try:
                    await peer.send_text(msg)
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        async with LOCK:
            ROOMS.get(session_id, {}).pop(role, None)
            if not ROOMS.get(session_id):
                ROOMS.pop(session_id, None)


@router.websocket("/ws/signaling/{session_id}/browser")
async def ws_browser(ws: WebSocket, session_id: str):
    # NOTE: validate JWT via query param ?token=... in production.
    await ws.accept()
    await _relay(session_id, "browser", ws)


@router.websocket("/ws/signaling/{session_id}/worker")
async def ws_worker(ws: WebSocket, session_id: str):
    # NOTE: worker auth via shared WORKER_TOKEN in headers.
    await ws.accept()
    await _relay(session_id, "worker", ws)
