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

    login_resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    pending_token = login_resp.json()["mfaPendingToken"]

    code = pyotp.TOTP(secret).now()
    resp = await client.post(
        "/api/mfa/login",
        json={"token": code},
        headers={"Authorization": f"Bearer {pending_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["verified"] is True
    assert "token" in resp.json()


@pytest.mark.asyncio
async def test_mfa_login_invalid_code(client):
    token = await _register_and_login(client)
    await client.post("/api/mfa/setup", headers={"Authorization": f"Bearer {token}"})

    login_resp = await client.post("/api/auth/login", json={"email": "user@test.com", "password": "secret123"})
    pending_token = login_resp.json()["mfaPendingToken"]

    resp = await client.post(
        "/api/mfa/login",
        json={"token": "000000"},
        headers={"Authorization": f"Bearer {pending_token}"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mfa_login_requires_pending_token(client):
    resp = await client.post("/api/mfa/login", json={"token": "123456"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_mfa_login_rejects_wrong_scope(client):
    token = await _register_and_login(client)
    resp = await client.post(
        "/api/mfa/login",
        json={"token": "123456"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
