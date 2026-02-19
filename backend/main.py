import sys
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio

# Ensure parent directory is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.models.analysis import AnalysisRequest
from backend.services.analysis_service import analysis_service
from backend.events.bus import event_bus

app = FastAPI(title="DMP-Core-Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(req: AnalysisRequest):
    try:
        return await analysis_service.analyze_data(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stream")
async def stream_events(request: Request):
    async def event_generator():
        queue = asyncio.Queue()
        async def listener(data): await queue.put(data)
        
        event_bus.subscribe("analysis_started", listener)
        event_bus.subscribe("data_processed", listener)
        event_bus.subscribe("analysis_completed", listener)
        event_bus.subscribe("analysis_error", listener)

        try:
            while True:
                if await request.is_disconnected(): break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        except asyncio.CancelledError: pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
