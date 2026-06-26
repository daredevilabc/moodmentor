import pytest
from unittest.mock import patch


def test_health_endpoint_healthy(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "dependencies" in data
    assert data["dependencies"]["gemini"] == "configured"
    assert data["dependencies"]["http_client"] == "available"


def test_health_endpoint_degraded_gemini(client):
    import main
    original_model = main.gemini_service.model
    main.gemini_service.model = None
    try:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["dependencies"]["gemini"] == "unavailable"
    finally:
        main.gemini_service.model = original_model


def test_health_endpoint_degraded_http_client(client):
    with patch("services.http_client.get_client", side_effect=Exception("No client")):
        response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["dependencies"]["http_client"] == "unavailable"