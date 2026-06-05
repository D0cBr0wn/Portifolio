import pyotp
import pytest


async def _register_and_login(client, email="user@test.com", password="secret123"):
    await client.post("/api/auth/register", json={"email": email, "password": password})
    resp = await client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["token"]


@pytest.mark.asyncio
async def test_mfa_setup(client):
    token = await _register_and_login(client)
    resp = await client.post("/api/mfa/setup", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "qrCodeDataURL" in data
    assert "secret" in data
    assert data["qrCodeDataURL"].startswith("data:image/png;base64,")


@pytest.mark.asyncio
async def test_mfa_setup_requires_auth(client):
    resp = await client.post("/api/mfa/setup")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mfa_login_valid_code(client):
    token = await _register_and_login(client)
    setup_resp = await client.post("/api/mfa/setup", headers={"Authorization": f"Bearer {token}"})
    secret = setup_resp.json()["secret"]

    all_resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    user_id = all_resp.json().get("userId")

    code = pyotp.TOTP(secret).now()
    resp = await client.post("/api/mfa/login", json={"user_id": user_id, "token": code})
    assert resp.status_code == 200
    assert resp.json()["verified"] is True
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_mfa_login_invalid_code(client):
    token = await _register_and_login(client)
    setup_resp = await client.post("/api/mfa/setup", headers={"Authorization": f"Bearer {token}"})
    secret = setup_resp.json()["secret"]

    all_resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    user_id = all_resp.json().get("userId")

    resp = await client.post("/api/mfa/login", json={"user_id": user_id, "token": "000000"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mfa_login_missing_user(client):
    resp = await client.post("/api/mfa/login", json={"user_id": 9999, "token": "123456"})
    assert resp.status_code == 400
