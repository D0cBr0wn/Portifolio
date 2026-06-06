import pytest


async def _setup(client):
    """Register first user (ADMIN), login, create a venue. Returns (admin_token, venue_id)."""
    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    token = resp.json()["token"]
    venue_resp = await client.post(
        "/api/venues/",
        json={"name": "Bataclan", "city": "Paris"},
        headers={"Authorization": f"Bearer {token}"},
    )
    return token, venue_resp.json()["id"]


async def _get_user_token(client):
    """Register a second user (USER role) and return their token."""
    reg = await client.post("/api/auth/register", json={"email": "user2@test.com", "password": "secret123"})
    assert reg.status_code == 201
    resp = await client.post("/api/auth/login", json={"email": "user2@test.com", "password": "secret123"})
    return resp.json()["token"]


@pytest.mark.asyncio
async def test_list_shows_public(client):
    resp = await client.get("/api/shows/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_show(client):
    token, venue_id = await _setup(client)
    resp = await client.post(
        "/api/shows/",
        json={"label": "Show 1", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["label"] == "Show 1"
    assert data["venueId"] == venue_id
    assert "venue" in data


@pytest.mark.asyncio
async def test_create_show_requires_auth(client):
    resp = await client.post("/api/shows/", json={"label": "X", "date": "2025-01-01T00:00:00", "venueId": 1})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_show(client):
    token, venue_id = await _setup(client)
    create_resp = await client.post(
        "/api/shows/",
        json={"label": "Old", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    sid = create_resp.json()["id"]
    resp = await client.put(
        f"/api/shows/{sid}",
        json={"label": "New", "date": "2025-12-15T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["label"] == "New"


@pytest.mark.asyncio
async def test_delete_show(client):
    token, venue_id = await _setup(client)
    create_resp = await client.post(
        "/api/shows/",
        json={"label": "ToDelete", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    sid = create_resp.json()["id"]
    resp = await client.delete(f"/api/shows/{sid}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_update_show_requires_admin(client):
    admin_token, venue_id = await _setup(client)
    create_resp = await client.post(
        "/api/shows/",
        json={"label": "Old", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    sid = create_resp.json()["id"]
    user_token = await _get_user_token(client)
    resp = await client.put(
        f"/api/shows/{sid}",
        json={"label": "New", "date": "2025-12-15T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_show_requires_admin(client):
    admin_token, venue_id = await _setup(client)
    create_resp = await client.post(
        "/api/shows/",
        json={"label": "ToDelete", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    sid = create_resp.json()["id"]
    user_token = await _get_user_token(client)
    resp = await client.delete(f"/api/shows/{sid}", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_show_requires_auth(client):
    resp = await client.put("/api/shows/1", json={"label": "X", "date": "2025-01-01T00:00:00", "venueId": 1})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_delete_show_requires_auth(client):
    resp = await client.delete("/api/shows/1")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_shows_return_camel_case(client):
    token, venue_id = await _setup(client)
    await client.post(
        "/api/shows/",
        json={"label": "CC Show", "date": "2025-12-01T20:00:00", "venueId": venue_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = await client.get("/api/shows/")
    items = resp.json()
    assert len(items) > 0
    assert "venueId" in items[0]
