FROM python:3.11-slim

WORKDIR /app

# The backend needs dependencies from the gateway/requirements.txt or we should have a unified one.
# Looking at the project structure, let's assume requirements.txt is in gateway/ or we should create one for backend.
# Since I saw requirements.txt in gateway, I'll use it or expect one in backend.
# I'll check if backend has its own requirements.txt first.
COPY requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
