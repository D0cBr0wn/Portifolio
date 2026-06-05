import pytest


async def _setup(client):
    await client.post("/api/auth/register", json={"email": "superuser@test.com", "password": "secret123"})
    admin_resp = await client.post("/api/auth/login", json={"email": "superuser@test.com", "password": "secret123"})
    admin_token = admin_resp.json()["token"]

    await client.post("/api/auth/register", json={"email": "user@test.com", "password": "secret123"})
    user_resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    user_token = user_resp.json()["token"]

    users_resp = await client.get("/api/users/", headers={"Authorization": f"Bearer {admin_token}"})
    users = users_resp.json()
    user_id = next(u["id"] for u in users if u["email"] == "user@test.com")
    admin_id = next(u["id"] for u in users if u["email"] == "superuser@test.com")

    return admin_token, user_token, admin_id, user_id


@pytest.mark.asyncio
async def test_list_users_admin_only(client):
    admin_token, user_token, _, _ = await _setup(client)
    resp = await client.get("/api/users/", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_users_forbidden_for_user(client):
    _, user_token, _, _ = await _setup(client)
    resp = await client.get("/api/users/", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_user_self(client):
    _, user_token, _, user_id = await _setup(client)
    resp = await client.get(f"/api/users/{user_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "user@test.com"


@pytest.mark.asyncio
async def test_get_user_forbidden_cross(client):
    admin_token, user_token, admin_id, user_id = await _setup(client)
    resp = await client.get(f"/api/users/{admin_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_update_user_self(client):
    _, user_token, _, user_id = await _setup(client)
    resp = await client.put(
        f"/api/users/{user_id}",
        json={"email": "newuser@test.com"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "newuser@test.com"


@pytest.mark.asyncio
async def test_delete_user_admin(client):
    admin_token, _, _, user_id = await _setup(client)
    resp = await client.delete(f"/api/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_user_forbidden(client):
    _, user_token, admin_id, user_id = await _setup(client)
    resp = await client.delete(f"/api/users/{admin_id}", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_patch_role(client):
    admin_token, _, _, user_id = await _setup(client)
    resp = await client.patch(
        f"/api/users/{user_id}/role",
        json={"role": "ADMIN"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_require_mfa(client):
    admin_token, _, _, user_id = await _setup(client)
    resp = await client.post(
        f"/api/users/{user_id}/mfa/require",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert "MFA requis" in resp.json()["message"]


@pytest.mark.asyncio
async def test_get_mfa_status(client):
    _, user_token, _, user_id = await _setup(client)
    resp = await client.get(f"/api/users/{user_id}/mfa", headers={"Authorization": f"Bearer {user_token}"})
    assert resp.status_code == 200
    assert "enabled" in resp.json()


@pytest.mark.asyncio
async def test_users_return_camel_case(client):
    admin_token, _, _, user_id = await _setup(client)
    resp = await client.get(f"/api/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
    data = resp.json()
    assert "mfaEnabled" in data
    assert "createdAt" in data
