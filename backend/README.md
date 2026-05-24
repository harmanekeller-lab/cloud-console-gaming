# Low-Spec Cloud Gaming — Backend GPU (FastAPI)

Backend séparé à déployer sur **un VPS** (FastAPI + signaling WebRTC + orchestration GPU)
et **RunPod / Vast.ai** (workers GPU avec PCSX2 / RPCS3 + VirtualGL + Xvfb + GStreamer).

L'app web Lovable Cloud gère : auth, profils, balances (temps en secondes), tickets,
sessions, heartbeat, paiements Moneroo. Ce backend gère **uniquement** :

1. **Signaling WebRTC** (offer/answer/ICE entre browser ↔ worker GPU).
2. **Orchestration GPU** : démarrer/arrêter des workers RunPod/Vast.ai à la demande.
3. **Streaming bridge** : route le flux video du worker vers le client via WebRTC.

> ⚠️ Firebase a été remplacé par **Lovable Cloud (Supabase)** pour l'app web.
> Ce backend valide les JWT Supabase (clé publique HS256) — pas de Firebase Admin SDK.

---

## Architecture

```
┌──────────────┐      WebRTC SDP/ICE       ┌──────────────────┐
│  Browser     │ ◄────────────────────────► │  FastAPI VPS     │
│  (Lovable)   │                            │  (signaling)     │
└──────┬───────┘                            └────────┬─────────┘
       │                                             │ HTTP API
       │ WebRTC media (video + datachannel)          │ RunPod/Vast
       │                                             ▼
       │                                    ┌────────────────────┐
       └──────────────────────────────────► │  GPU Worker (Pod)  │
              flux H.264 / VP8              │  PCSX2 / RPCS3     │
              gamepad inputs                │  + Xvfb+VirtualGL  │
                                            │  + GStreamer       │
                                            └────────────────────┘
```

---

## Déploiement

### 1) FastAPI sur ton VPS (Hetzner, OVH, etc.)

```bash
cd backend-gpu
cp .env.example .env
# édite .env : SUPABASE_URL, SUPABASE_JWT_SECRET, RUNPOD_API_KEY, MONEROO_API_KEY
docker compose up -d
```

API disponible sur `http://<vps-ip>:8000`. Mets un reverse-proxy (Caddy / nginx)
devant pour le TLS — WebRTC exige HTTPS/WSS côté browser.

### 2) Workers GPU (RunPod)

Build l'image worker et push sur Docker Hub :

```bash
cd backend-gpu/docker
docker build -t <ton-user>/cloudgaming-worker:latest -f Dockerfile.worker .
docker push <ton-user>/cloudgaming-worker:latest
```

Sur RunPod, crée un **Pod Template** pointant vers cette image avec :
- GPU : RTX 3060 ou + (8 GB VRAM mini pour RPCS3)
- Ports exposés : 8001/tcp (control), 5000-5100/udp (WebRTC)
- Env : `WORKER_TOKEN=<token-partagé-avec-le-vps>`

### 3) Auto-scaling

```bash
python scripts/autoscale.py
```

Scrute la file de sessions en attente côté Supabase (table `sessions` status=`pending`)
et démarre/stoppe les pods RunPod en conséquence.

---

## Sécurité

- **JWT Supabase** vérifié via `SUPABASE_JWT_SECRET` (clé HS256 du projet Lovable Cloud,
  visible dans Connectors → Cloud → API).
- **Heartbeat** : chaque session envoie un POST /heartbeat toutes les 60s. Si pas de
  battement pendant 3 minutes → session terminée, temps restant recrédité.
- **Webhook Moneroo** vérifié par signature HMAC (header `x-moneroo-signature`).

---

## Fichiers livrés

- `app/main.py` — FastAPI app
- `app/auth.py` — middleware JWT Supabase
- `app/routers/session.py` — start/stop/heartbeat
- `app/routers/signaling.py` — WebSocket signaling WebRTC
- `app/routers/webhook.py` — webhook Moneroo
- `app/services/runpod.py` — client RunPod
- `app/services/supabase.py` — client Supabase admin (service_role)
- `docker/Dockerfile` — image FastAPI
- `docker/Dockerfile.worker` — image worker GPU (PCSX2+RPCS3+VirtualGL+GStreamer)
- `docker/docker-compose.yml`
- `scripts/autoscale.py` — boucle d'auto-scaling RunPod
- `requirements.txt`
- `.env.example`
