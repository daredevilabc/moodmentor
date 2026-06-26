import pytest
from unittest.mock import patch


def test_generate_wisdom_success(client, auth_headers, mock_gemini, mock_news, mock_history, mock_philosophy):
    response = client.post(
        "/api/generate-wisdom",
        json={"mood": "sad", "philosophy": "Stoicism"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mood"] == "sad"
    assert data["philosophy"] == "Stoicism"
    assert "wisdom" in data
    assert "sources" in data
    assert "philosophy" in data["sources"]
    assert "news" in data["sources"]
    assert "historical_events" in data["sources"]
    assert "inspirational_story" in data["sources"]
    mock_gemini.assert_called_once()


def test_generate_wisdom_invalid_mood(client, auth_headers):
    response = client.post(
        "/api/generate-wisdom",
        json={"mood": "invalid_mood", "philosophy": "Stoicism"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["error"]["code"] == "VALIDATION_ERROR"
    assert data["detail"]["error"]["message"] == "Invalid mood"


def test_generate_wisdom_invalid_philosophy(client, auth_headers):
    response = client.post(
        "/api/generate-wisdom",
        json={"mood": "sad", "philosophy": "InvalidPhilosophy"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"]["error"]["code"] == "VALIDATION_ERROR"
    assert data["detail"]["error"]["message"] == "Invalid philosophy"


def test_generate_wisdom_missing_fields(client, auth_headers):
    response = client.post(
        "/api/generate-wisdom",
        json={"mood": "sad"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_generate_wisdom_empty_fields(client, auth_headers):
    response = client.post(
        "/api/generate-wisdom",
        json={"mood": "", "philosophy": "Stoicism"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_generate_wisdom_no_auth(client):
    response = client.post(
        "/api/generate-wisdom",
        json={"mood": "sad", "philosophy": "Stoicism"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid API key"


def test_generate_wisdom_gemini_timeout(client, auth_headers, mock_news, mock_history, mock_philosophy):
    from unittest.mock import patch
    from services.exceptions import GeminiTimeoutError
    with patch("services.gemini_service.gemini_service.generate_wisdom", side_effect=GeminiTimeoutError()):
        response = client.post(
            "/api/generate-wisdom",
            json={"mood": "sad", "philosophy": "Stoicism"},
            headers=auth_headers,
        )
    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "GEMINI_TIMEOUT"


def test_generate_wisdom_gemini_api_error(client, auth_headers, mock_news, mock_history, mock_philosophy):
    from unittest.mock import patch
    from services.exceptions import GeminiAPIError
    with patch("services.gemini_service.gemini_service.generate_wisdom", side_effect=GeminiAPIError("API error")):
        response = client.post(
            "/api/generate-wisdom",
            json={"mood": "sad", "philosophy": "Stoicism"},
            headers=auth_headers,
        )
    assert response.status_code == 500
    data = response.json()
    assert data["error"]["code"] == "GEMINI_API_ERROR"