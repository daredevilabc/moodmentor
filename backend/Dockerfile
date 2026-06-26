FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt

FROM base AS production

COPY . .

ENV BACKEND_HOST=0.0.0.0 \
    BACKEND_PORT=9000 \
    GUNICORN_WORKERS=4

EXPOSE 9000

CMD ["gunicorn", "main:app", "-c", "gunicorn.conf.py"]