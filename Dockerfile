# syntax=docker/dockerfile:1
FROM python:3.12-slim AS backend

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY core/ core/
COPY api/ api/

ENV DATA_DIR=/data
ENV BACKEND_URL=http://localhost:8000
RUN mkdir -p /data && chmod 777 /data
VOLUME /data

EXPOSE 7860 8000

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 1"]
