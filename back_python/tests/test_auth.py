import pytest


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
