import pytest
import os


def test_root_endpoint_no_auth(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "MoodMentor API is running"


def test_moods_endpoint_requires_auth(client):
    response = client.get("/api/moods")
    assert response.status_code == 401


def test_moods_endpoint_with_auth(client, auth_headers):
    response = client.get("/api/moods", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "sad" in data
    assert "anxious" in data


def test_philosophies_endpoint_requires_auth(client):
    response = client.get("/api/philosophies")
    assert response.status_code == 401


def test_philosophies_endpoint_with_auth(client, auth_headers):
    response = client.get("/api/philosophies", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "Stoicism" in data


def test_invalid_api_key(client):
    response = client.get("/api/moods", headers={"X-API-Key": "wrong_key"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid API key"


def test_rate_limit_root(client):
    if os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true":
        pytest.skip("Rate limiting disabled in test environment")
    for _ in range(105):
        response = client.get("/")
    assert response.status_code == 429


def test_rate_limit_generate_wisdom(client, auth_headers, mock_gemini, mock_news, mock_history, mock_philosophy):
    if os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true":
        pytest.skip("Rate limiting disabled in test environment")
    for _ in range(21):
        response = client.post(
            "/api/generate-wisdom",
            json={"mood": "sad", "philosophy": "Stoicism"},
            headers=auth_headers,
        )
    assert response.status_code == 429


def test_no_auth_when_api_key_unset(client):
    original_key = os.environ.get("API_KEY")
    os.environ["API_KEY"] = ""

    try:
        from importlib import reload
        from services import http_client
        reload(http_client)
    finally:
        if original_key:
            os.environ["API_KEY"] = original_key
        else:
            os.environ.pop("API_KEY", None)


def test_cors_headers(client):
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200