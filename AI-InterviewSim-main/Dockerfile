# syntax=docker/dockerfile:1

FROM python:3.11-slim

# Install build + runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies globally
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Use shell form CMD to allow environment variable substitution
# Railway provides PORT env var dynamically
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2 --proxy-headers
