FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Bake the sentence-transformer weights into the image so the first request
# doesn't stall while the model downloads.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

COPY backend/ ./backend/
COPY frontend/ ./frontend/

# logo.png is a binary excluded from git , download from a pinned GitHub commit
RUN curl -fsSL "https://raw.githubusercontent.com/Kritantasasanroy/Bhagyakram/2c5aa7b/frontend/logo.png" \
    -o /app/frontend/logo.png

# Hugging Face Spaces requires port 7860
EXPOSE 7860

WORKDIR /app/backend
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
