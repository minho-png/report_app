from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from backend.models.analysis import AnalysisRequest
import httpx
import json
import asyncio

router = APIRouter()
BACKEND_URL = "http://localhost:8001"

@router.post("/analyze")
async def analyze(req: AnalysisRequest):
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(f"{BACKEND_URL}/analyze", json=req.model_dump())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@router.get("/stream")
async def stream_events(request: Request):
    async def event_generator():
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("GET", f"{BACKEND_URL}/stream") as response:
                async for line in response.aiter_lines():
                    if await request.is_disconnected():
                        break
                    if line:
                        yield f"{line}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
