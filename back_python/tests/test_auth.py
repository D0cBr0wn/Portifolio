import app.database as db_module
import pytest
from app.models import User
from sqlalchemy import select


@pytest.mark.asyncio
async def test_register(client):
    resp = await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "user@test.com"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_first_user_is_admin(client):
    resp = await client.post("/api/auth/register", json={"email": "admin@test.com", "password": "secret123"})
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    assert resp.status_code == 200
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "wrong"})
    assert resp.status_code == 401
    assert resp.json()["error"] == "Identifiants invalides"


@pytest.mark.asyncio
async def test_login_unknown_user(client):
    resp = await client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "secret"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_honeypot(client):
    resp = await client.post("/api/auth/login", json={"email": "admin@test.com", "password": "secret"})
    assert resp.status_code == 403
    assert resp.json()["error"] == "Identifiants invalides"


@pytest.mark.asyncio
async def test_login_bad_body(client):
    resp = await client.post("/api/auth/login", json={"email": "not-an-email", "password": "x"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_is_admin_ignored(client):
    await client.post("/api/auth/register", json={"email": "first@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/register", json={"email": "attacker@test.com", "password": "secret123", "isAdmin": True})
    assert resp.status_code == 201
    async with db_module.async_session_factory() as db:
        result = await db.execute(select(User).where(User.email == "attacker@test.com"))
        user = result.scalar_one()
        assert user.role.value == "USER"
