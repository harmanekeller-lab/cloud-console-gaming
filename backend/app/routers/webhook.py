"""Moneroo webhook — credits user balance after successful payment."""
import hmac
import hashlib
from fastapi import APIRouter, Header, HTTPException, Request
from ..config import settings
from ..services import supabase as sb

router = APIRouter(prefix="/webhook", tags=["webhook"])

# ticket_id -> seconds_to_credit (mirror of src/lib/tickets.ts)
TICKETS = {
    "flash":    2 * 3600,
    "gamer":    4 * 3600 + 20 * 60,
    "hardcore": 8 * 3600,
}


def _verify_sig(body: bytes, signature: str | None) -> bool:
    if not signature or not settings.MONEROO_WEBHOOK_SECRET:
        return False
    expected = hmac.new(
        settings.MONEROO_WEBHOOK_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/moneroo")
async def moneroo(req: Request, x_moneroo_signature: str | None = Header(default=None)):
    body = await req.body()
    if not _verify_sig(body, x_moneroo_signature):
        raise HTTPException(401, "Invalid signature")
    payload = await req.json()
    if payload.get("event") != "payment.success":
        return {"ignored": True}
    meta = payload.get("data", {}).get("metadata", {}) or {}
    user_id = meta.get("user_id")
    ticket = meta.get("ticket")
    seconds = TICKETS.get(ticket)
    if not (user_id and seconds):
        raise HTTPException(400, "Missing user_id or ticket in metadata")
    new_balance = sb.credit_seconds(user_id, seconds)
    sb.supabase.table("payments").insert({
        "user_id": user_id,
        "ticket": ticket,
        "amount": payload.get("data", {}).get("amount"),
        "provider": "moneroo",
        "external_id": payload.get("data", {}).get("id"),
        "status": "success",
    }).execute()
    return {"credited_seconds": seconds, "balance_seconds": new_balance}
