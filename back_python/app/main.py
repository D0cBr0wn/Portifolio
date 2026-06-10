from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.middleware.ip_ban import IpBanMiddleware

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Odyssey of One — Python backend")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(IpBanMiddleware)

from app.routers import auth, backoffice, contact, mfa, shows, users, venues  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(mfa.router, prefix="/api/mfa", tags=["mfa"])
app.include_router(shows.router, prefix="/api/shows", tags=["shows"])
app.include_router(venues.router, prefix="/api/venues", tags=["venues"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(backoffice.router, prefix="/api/backoffice", tags=["backoffice"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])


@app.get("/")
async def health(_request: Request):
    return {"status": "ok"}
