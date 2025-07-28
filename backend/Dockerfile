# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# System deps (if any), then Python reqs
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code & cron script
COPY . .

# Entrypoint: run update_indices.py every 5 minutes
CMD ["sh", "cron.sh"]

