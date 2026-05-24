"""GPU worker control agent.

On startup:
  1. Connects WebSocket to the FastAPI signaling server.
  2. Receives a `launch` message { session_id, game_url, system: 'ps2'|'ps3' }.
  3. Downloads the ISO to /tmp.
  4. Launches PCSX2/RPCS3 under `vglrun` on display :99.
  5. Captures the Xvfb framebuffer through GStreamer and pipes it as a WebRTC video
     track to the browser via the signaling relay.

This is a starter scaffold — production needs:
  - Proper GStreamer pipeline → aiortc MediaStreamTrack bridge (use webrtcbin).
  - DataChannel handler for gamepad inputs (forward via uinput or xdotool).
  - Hardware encode (nvh264enc) when available.
"""
import asyncio
import json
import os
import subprocess
import sys

import httpx
import websockets

SIGNALING_URL = os.environ.get("SIGNALING_URL", "wss://your-vps.example.com")
WORKER_TOKEN = os.environ.get("WORKER_TOKEN", "change-me")


async def download(url: str, dest: str) -> None:
    async with httpx.AsyncClient(timeout=None) as c:
        async with c.stream("GET", url) as r:
            r.raise_for_status()
            with open(dest, "wb") as f:
                async for chunk in r.aiter_bytes(1 << 20):
                    f.write(chunk)


def launch_emulator(system: str, iso_path: str) -> subprocess.Popen:
    if system == "ps2":
        cmd = ["vglrun", "/usr/local/bin/pcsx2.AppImage", "--fullscreen", iso_path]
    else:
        cmd = ["vglrun", "/usr/local/bin/rpcs3.AppImage", "--no-gui", iso_path]
    return subprocess.Popen(cmd, env={**os.environ, "DISPLAY": ":99"})


async def session_loop(session_id: str):
    url = f"{SIGNALING_URL}/ws/signaling/{session_id}/worker"
    async with websockets.connect(url, extra_headers={"x-worker-token": WORKER_TOKEN}) as ws:
        print(f"[worker] connected for session {session_id}", flush=True)
        # Wait for launch payload
        raw = await ws.recv()
        msg = json.loads(raw)
        if msg.get("type") != "launch":
            return
        iso = "/tmp/game.iso"
        await download(msg["game_url"], iso)
        proc = launch_emulator(msg["system"], iso)
        try:
            # TODO: bridge GStreamer → aiortc → ws SDP/ICE relay here.
            # Placeholder: just keep the session alive while emulator runs.
            while proc.poll() is None:
                await asyncio.sleep(5)
        finally:
            if proc.poll() is None:
                proc.terminate()


async def main():
    # In a real deployment, RunPod env will inject SESSION_ID at pod start.
    session_id = os.environ.get("SESSION_ID")
    if not session_id:
        print("[worker] no SESSION_ID, idling", flush=True)
        while True:
            await asyncio.sleep(60)
    await session_loop(session_id)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
