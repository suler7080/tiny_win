FROM python:3.11-slim

WORKDIR /app

# Install system deps for asyncpg and bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app source code
COPY src/backend/app/ ./app/

ENV PORT=8080
EXPOSE 8080

# Start FastAPI with dynamic Railway PORT support
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
