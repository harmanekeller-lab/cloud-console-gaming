"""Admin Supabase client (service_role) — bypasses RLS. Server-side only."""
from supabase import Client, create_client
from ..config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_balance_seconds(user_id: str) -> int:
    res = supabase.table("balances").select("seconds").eq("user_id", user_id).single().execute()
    return int(res.data.get("seconds", 0)) if res.data else 0


def deduct_seconds(user_id: str, delta: int) -> int:
    current = get_balance_seconds(user_id)
    new_val = max(0, current - delta)
    supabase.table("balances").update({"seconds": new_val}).eq("user_id", user_id).execute()
    return new_val


def credit_seconds(user_id: str, delta: int) -> int:
    current = get_balance_seconds(user_id)
    new_val = current + delta
    supabase.table("balances").upsert(
        {"user_id": user_id, "seconds": new_val}, on_conflict="user_id"
    ).execute()
    return new_val


def set_session_status(session_id: str, status: str, **extra) -> None:
    supabase.table("sessions").update({"status": status, **extra}).eq("id", session_id).execute()


def create_session(user_id: str, game_id: str, worker_id: str | None = None) -> dict:
    res = supabase.table("sessions").insert({
        "user_id": user_id,
        "game_id": game_id,
        "worker_id": worker_id,
        "status": "pending",
    }).execute()
    return res.data[0]


def list_pending_sessions() -> list[dict]:
    res = supabase.table("sessions").select("*").eq("status", "pending").execute()
    return res.data or []
