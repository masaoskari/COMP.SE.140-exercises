"""Tests for the service 2 application."""
import pytest
from app import app


class MockPopen: # pylint: disable=too-few-public-methods
    """Mock Popen class for testing"""
    def __init__(self, stdout):
        """Initialize the mock Popen class."""
        super().__init__()
        self.stdout = stdout

    def read(self):
        """Return the mock stdout."""
        return self.stdout


@pytest.fixture(name="client")
def fixture_client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_get_service_info(client, monkeypatch):
    """Test the service_info endpoint."""

    def mock_popen(command):
        """Mock the os.popen function to get test work with different os."""
        if "df -h /" in command:
            return MockPopen(
                "Filesystem Size Used Avail Use% Mounted on\n"
                "/dev/sda1 100G 50G 50G 50% /\n"
            )
        if "ps -ax" in command:
            return MockPopen(
                "  PID TTY          TIME CMD\n"
                "    1 ?        00:00:00 init\n"
            )
        return MockPopen("")
    monkeypatch.setattr("os.popen", mock_popen)
    response = client.get("/info")
    assert response.status_code == 200
    data = response.get_json()
    assert "ipAddresses" in data
    assert "diskSpace" in data
    assert "processes" in data
    assert "serviceUptime" in data
    assert "osUptime" in data


def test_service_info_error(client, mocker):
    """Test the service_info endpoint with an error."""
    mocker.patch('app.collect_service_info', side_effect=Exception('Test error'))
    response = client.get('/info')
    assert response.status_code == 500
    assert response.json == {"error": "Failed to collect service 2 information."}
