"""Auto-scaling loop — keeps RunPod pod count aligned with pending sessions.

Run as a sidecar (see docker-compose). Polls Supabase every 15s:
  - For each pending session without worker_id → start a pod.
  - For each running pod with no active session → terminate.

Tune MIN_IDLE_POOL to keep N warm pods for instant joins (costs more).
"""
import asyncio
from app.services import supabase as sb, runpod as rp

POLL_INTERVAL = 15
MIN_IDLE_POOL = 0     # warm pods to keep running
MAX_POOL = 5          # safety cap


async def tick():
    pending = sb.list_pending_sessions()
    print(f"[autoscale] pending sessions: {len(pending)}")
    pods = await rp.list_pods()
    running_ids = {p["id"] for p in pods if p.get("desiredStatus") == "RUNNING"}
    assigned = {s.get("worker_id") for s in pending if s.get("worker_id")}

    # Scale up
    for s in pending:
        if s.get("worker_id"):
            continue
        if len(running_ids) >= MAX_POOL:
            print("[autoscale] MAX_POOL reached, skipping")
            break
        print(f"[autoscale] starting pod for session {s['id']}")
        try:
            res = await rp.start_pod(f"sess-{s['id'][:8]}")
            pid = res.get("data", {}).get("podFindAndDeployOnDemand", {}).get("id")
            if pid:
                sb.set_session_status(s["id"], "starting", worker_id=pid)
                running_ids.add(pid)
        except Exception as e:
            print(f"[autoscale] start failed: {e}")

    # Scale down: terminate pods not assigned and above MIN_IDLE_POOL
    idle = [pid for pid in running_ids if pid not in assigned]
    excess = max(0, len(idle) - MIN_IDLE_POOL)
    for pid in idle[:excess]:
        print(f"[autoscale] terminating idle pod {pid}")
        try:
            await rp.stop_pod(pid)
        except Exception as e:
            print(f"[autoscale] stop failed: {e}")


async def main():
    while True:
        try:
            await tick()
        except Exception as e:
            print(f"[autoscale] tick error: {e}")
        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
