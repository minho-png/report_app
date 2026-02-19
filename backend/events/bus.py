import asyncio
from typing import Callable, Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class EventBus:
    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, listener: Callable):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(listener)
        logger.info(f"Subscribed to event: {event_type}")

    async def emit(self, event_type: str, data: Any = None):
        logger.info(f"Emitting event: {event_type}")
        if event_type in self._listeners:
            tasks = [asyncio.create_task(listener(data)) for listener in self._listeners[event_type]]
            if tasks:
                await asyncio.gather(*tasks)

event_bus = EventBus()
