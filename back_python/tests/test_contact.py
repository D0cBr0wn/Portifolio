import pytest


async def _admin_token(client) -> str:
    await client.post("/api/auth/register", json={"email": "superuser@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/login", json={"email": "superuser@test.com", "password": "secret123"})
    return resp.json()["token"]


async def _user_token(client) -> str:
    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    return resp.json()["token"]


_VALID_PAYLOAD = {"name": "Alice", "email": "alice@example.com", "message": "Bonjour !"}


@pytest.mark.asyncio
async def test_post_contact_returns_201(client):
    resp = await client.post("/api/contact/", json=_VALID_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"
    assert data["message"] == "Bonjour !"
    assert "id" in data
    assert "createdAt" in data


@pytest.mark.asyncio
async def test_post_contact_invalid_email_returns_422(client):
    resp = await client.post("/api/contact/", json={"name": "Alice", "email": "not-an-email", "message": "Hello"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_post_contact_name_too_long_returns_422(client):
    resp = await client.post("/api/contact/", json={"name": "A" * 101, "email": "a@b.com", "message": "Hello"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_post_contact_message_too_long_returns_422(client):
    resp = await client.post("/api/contact/", json={"name": "Alice", "email": "a@b.com", "message": "X" * 2001})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_contact_without_auth_returns_401(client):
    resp = await client.get("/api/contact/")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_contact_as_user_returns_403(client):
    # first user is ADMIN, second user gets USER role
    await client.post("/api/auth/register", json={"email": "superuser@test.com", "password": "secret123"})
    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    resp_login = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    user_token = resp_login.json()["token"]
    resp = await client.get("/api/contact/", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_contact_as_admin_returns_200(client):
    admin_token = await _admin_token(client)
    await client.post("/api/contact/", json=_VALID_PAYLOAD)
    resp = await client.get("/api/contact/", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Alice"
    assert "createdAt" in data[0]


@pytest.mark.asyncio
async def test_get_contact_sorted_by_date_desc(client):
    admin_token = await _admin_token(client)
    await client.post("/api/contact/", json={"name": "First", "email": "a@b.com", "message": "msg1"})
    await client.post("/api/contact/", json={"name": "Second", "email": "b@b.com", "message": "msg2"})
    resp = await client.get("/api/contact/", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["name"] == "Second"
    assert data[1]["name"] == "First"
