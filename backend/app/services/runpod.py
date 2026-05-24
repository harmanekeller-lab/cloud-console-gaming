"""Minimal RunPod GraphQL client — start/stop GPU pods on demand."""
import httpx
from ..config import settings

RUNPOD_API = "https://api.runpod.io/graphql"


async def _gql(query: str, variables: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            RUNPOD_API,
            headers={"Authorization": f"Bearer {settings.RUNPOD_API_KEY}"},
            json={"query": query, "variables": variables or {}},
        )
        r.raise_for_status()
        return r.json()


async def start_pod(name: str) -> dict:
    """Start a new on-demand GPU pod from the configured template."""
    q = """
    mutation ($input: PodFindAndDeployOnDemandInput!) {
      podFindAndDeployOnDemand(input: $input) {
        id imageName machineId desiredStatus
      }
    }
    """
    variables = {
        "input": {
            "name": name,
            "templateId": settings.RUNPOD_TEMPLATE_ID,
            "gpuTypeId": settings.RUNPOD_GPU_TYPE,
            "cloudType": "SECURE",
            "gpuCount": 1,
            "volumeInGb": 20,
            "containerDiskInGb": 20,
        }
    }
    return await _gql(q, variables)


async def stop_pod(pod_id: str) -> dict:
    q = """
    mutation ($input: PodTerminateInput!) {
      podTerminate(input: $input)
    }
    """
    return await _gql(q, {"input": {"podId": pod_id}})


async def list_pods() -> list[dict]:
    q = """{ myself { pods { id name desiredStatus machineId runtime { uptimeInSeconds } } } }"""
    data = await _gql(q)
    return data.get("data", {}).get("myself", {}).get("pods", []) or []
