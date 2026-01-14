# Use a lightweight Python base image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code (Using .dockerignore to exclude local .env is good practice)
COPY . .

# Expose the port
EXPOSE 8000

# Start Uvicorn using shell variables injected at runtime
# We remove '--env-file' because the vars are already in the environment
CMD uvicorn main:app --host ${HOST} --port ${PORT}