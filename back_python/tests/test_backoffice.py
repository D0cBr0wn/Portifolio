import pytest


async def _setup(client):
    await client.post("/api/auth/register", json={"email": "superuser@test.com", "password": "secret123"})
    admin_resp = await client.post("/api/auth/login", json={"email": "superuser@test.com", "password": "secret123"})
    admin_token = admin_resp.json()["token"]

    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    user_resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    user_token = user_resp.json()["token"]

    venue_resp = await client.post(
        "/api/venues/",
        json={"name": "Bataclan", "city": "Paris"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    venue_id = venue_resp.json()["id"]

    await client.post(
        "/api/shows/",
        json={"label": "Show 1", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    return admin_token, user_token


@pytest.mark.asyncio
async def test_backoffice_shows_admin(client):
    admin_token, _ = await _setup(client)
    resp = await client.get("/api/backoffice/shows", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert "createdBy" in items[0]
    assert "createdAt" in items[0]
    assert "venueId" in items[0]


@pytest.mark.asyncio
async def test_backoffice_shows_forbidden(client):
    _, user_token = await _setup(client)
    resp = await client.get("/api/backoffice/shows", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_backoffice_venues_admin(client):
    admin_token, _ = await _setup(client)
    resp = await client.get("/api/backoffice/venues", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert "createdBy" in items[0]
    assert "createdAt" in items[0]


@pytest.mark.asyncio
async def test_backoffice_venues_forbidden(client):
    _, user_token = await _setup(client)
    resp = await client.get("/api/backoffice/venues", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_backoffice_shows_unauthenticated(client):
    resp = await client.get("/api/backoffice/shows")
    assert resp.status_code == 401
