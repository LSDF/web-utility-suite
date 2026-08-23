from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from tools.osint import username_search, domain_whois, dns_lookup, ip_info, DISCLAIMER

app = FastAPI(
    title="Cheetah OSINT",
    description="Legal Open Source Intelligence tools - Public information only",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent / "frontend"

@app.get("/api")
def root():
    return {
        "name": "Cheetah OSINT",
        "version": "0.1.0",
        "status": "online",
        "disclaimer": DISCLAIMER.strip(),
        "tools": ["username", "whois", "dns", "ip"]
    }

@app.get("/username")
async def search_username(q: str = Query(..., min_length=2, max_length=40)):
    if not q.replace("_", "").replace(".", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid username format")
    return await username_search(q)

@app.get("/whois")
def whois_lookup(domain: str = Query(..., min_length=3)):
    return domain_whois(domain.strip().lower())

@app.get("/dns")
def dns_records(domain: str = Query(..., min_length=3)):
    return dns_lookup(domain.strip().lower())

@app.get("/ip")
async def ip_lookup(ip: str = Query(..., min_length=7)):
    return await ip_info(ip.strip())

@app.get("/")
async def serve_frontend():
    index = FRONTEND_DIR / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"error": "Frontend not found"}

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
