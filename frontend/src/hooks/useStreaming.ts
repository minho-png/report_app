import { useState, useEffect } from 'react';

export function useStreaming() {
    const [events, setEvents] = useState<any[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [lastEvent, setLastEvent] = useState<any>(null);

    const startStreaming = () => {
        setIsStreaming(true);
        setEvents([]);

        // In local development, the URL might need to be absolute
        const eventSource = new EventSource('http://localhost:8000/api/analysis/stream');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setEvents((prev) => [...prev, data]);
            setLastEvent(data);

            if (data.type === 'analysis_completed' || data.type === 'analysis_error') {
                eventSource.close();
                setIsStreaming(false);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            setIsStreaming(false);
        };

        return () => {
            eventSource.close();
        };
    };

    return { events, isStreaming, lastEvent, startStreaming };
}
