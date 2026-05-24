#!/usr/bin/env bash
set -euo pipefail

# Start virtual X server (1280x720, 24bpp) on :99
Xvfb :99 -screen 0 1280x720x24 +extension GLX +render -noreset &
sleep 1

# Configure VirtualGL (uses host GPU via nvidia-container-toolkit on RunPod/Vast.ai)
export VGL_DISPLAY=:99
export DISPLAY=:99

# Optional audio
pulseaudio --start --exit-idle-time=-1 || true

# Launch the control agent. It waits for a WS instruction from the FastAPI VPS,
# then launches PCSX2 or RPCS3 under vglrun and streams the output via WebRTC.
exec python3 /opt/worker_agent.py
