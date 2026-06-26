import os

workers = int(os.getenv("GUNICORN_WORKERS", "4"))
worker_class = "uvicorn.workers.UvicornWorker"
bind = f"{os.getenv('BACKEND_HOST', '0.0.0.0')}:{os.getenv('BACKEND_PORT', '9000')}"
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "5"))
max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", "1000"))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", "50"))
accesslog = os.getenv("GUNICORN_ACCESSLOG", "-")
errorlog = os.getenv("GUNICORN_ERRORLOG", "-")
loglevel = os.getenv("LOG_LEVEL", "info").lower()

def on_starting(server):
    import sys
    import asyncio
    
    # Ensure current directory is in python path to load services
    cwd = os.getcwd()
    if cwd not in sys.path:
        sys.path.insert(0, cwd)
        
    os.environ["RUNNING_UNDER_GUNICORN"] = "true"
    
    try:
        from services.database import init_db, close_db
        server.log.info("Gunicorn master: Running database initialization (create_all)...")
        asyncio.run(init_db())
        asyncio.run(close_db())
        server.log.info("Gunicorn master: Database initialization successful.")
    except Exception as e:
        server.log.error(f"Gunicorn master: Database initialization failed: {e}")

