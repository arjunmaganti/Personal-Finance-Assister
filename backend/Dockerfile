# Use the official Python image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy the requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder contents
COPY . .

# Cloud Run expects the app to listen on the port defined by the $PORT env var
# We set host to 0.0.0.0 so it accepts external connections
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}