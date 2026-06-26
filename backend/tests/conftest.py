import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

os.environ["GEMINI_API_KEY"] = "test_key"
os.environ["API_KEY"] = "test_api_key"
os.environ["DISABLE_RATE_LIMIT"] = "true"


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"X-API-Key": "test_api_key"}


@pytest.fixture
def mock_gemini():
    with patch("services.gemini_service.gemini_service.generate_wisdom", new_callable=AsyncMock) as mock:
        mock.return_value = "Test wisdom message with actionable advice."
        yield mock


@pytest.fixture
def mock_news():
    with patch("services.news_service.news_service.get_todays_news", new_callable=AsyncMock) as mock:
        mock.return_value = [
            {"title": "Test News", "description": "Test description", "url": "http://test.com"}
        ]
        yield mock


@pytest.fixture
def mock_history():
    with patch("services.history_service.history_service.get_historical_events", new_callable=AsyncMock) as mock_events:
        with patch("services.history_service.history_service.get_inspirational_story", new_callable=AsyncMock) as mock_story:
            mock_events.return_value = [
                {"year": 2020, "text": "Test event", "url": "http://test.com"}
            ]
            mock_story.return_value = {
                "name": "Test Person",
                "summary": "Test story summary",
                "url": "http://test.com"
            }
            yield mock_events, mock_story


@pytest.fixture
def mock_philosophy():
    with patch("services.philosophy_service.philosophy_service.get_summary", new_callable=AsyncMock) as mock:
        mock.return_value = {"title": "Stoicism", "summary": "Test philosophy summary"}
        yield mock


@pytest.fixture(autouse=True)
def clear_cache():
    from services.cache import clear
    clear()
    yield
    clear()