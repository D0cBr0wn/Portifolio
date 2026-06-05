import pytest


async def _get_token(client):
    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    return resp.json()["token"]


@pytest.mark.asyncio
async def test_list_venues_public(client):
    resp = await client.get("/api/venues/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_venue(client):
    token = await _get_token(client)
    resp = await client.post(
        "/api/venues/",
        json={"name": "Bataclan", "city": "Paris"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Bataclan"
    assert data["city"] == "Paris"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_venue_requires_auth(client):
    resp = await client.post("/api/venues/", json={"name": "X", "city": "Y"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_venue(client):
    token = await _get_token(client)
    create_resp = await client.post(
        "/api/venues/",
        json={"name": "Old", "city": "Lyon"},
        headers={"Authorization": f"Bearer {token}"},
    )
    vid = create_resp.json()["id"]
    resp = await client.put(
        f"/api/venues/{vid}",
        json={"name": "New", "city": "Marseille"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


@pytest.mark.asyncio
async def test_update_venue_not_found(client):
    token = await _get_token(client)
    resp = await client.put(
        "/api/venues/9999",
        json={"name": "X", "city": "Y"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_venue(client):
    token = await _get_token(client)
    create_resp = await client.post(
        "/api/venues/",
        json={"name": "ToDelete", "city": "Nice"},
        headers={"Authorization": f"Bearer {token}"},
    )
    vid = create_resp.json()["id"]
    resp = await client.delete(f"/api/venues/{vid}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_venue_not_found(client):
    token = await _get_token(client)
    resp = await client.delete("/api/venues/9999", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_venues_returns_camel_case(client):
    token = await _get_token(client)
    await client.post(
        "/api/venues/",
        json={"name": "Venue CC", "city": "Paris", "zipCode": "75001"},
        headers={"Authorization": f"Bearer {token}"},
    )
    resp = await client.get("/api/venues/")
    items = resp.json()
    assert len(items) > 0
    assert "zipCode" in items[0]
