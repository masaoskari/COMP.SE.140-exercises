"""Tests for the service 2 application."""
import pytest
from app import app

@pytest.fixture(name="client")
def fixture_client():
    """Create a test client for the Flask application."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_is_alive(client):
    """Test the is_alive endpoint."""
    rv = client.get('/')
    assert rv.status_code == 200
    assert rv.data == b'Service 2 alive!'

def test_service_info(client, mocker):
    """Test the service_info endpoint."""
    expected_info = {
        "ipAddresses": {"eth0": ["192.168.1.1"]},
        "diskSpace": {"Filesystem": "/", "Size": "100G", "Used": "50G", 
                      "Avail": "50G", "Use%": "50%", "Mounted on": "/"},
        "processes": [{"PID": "1", "TTY": "?", "STAT": "Ss", "TIME": "0:00",
                        "COMMAND": "init"}],
        "serviceUptime": 1000,
        "osUptime": 10000,
    }

    mocker.patch('app.collect_service_info', return_value=expected_info)
    rv = client.get('/info')
    assert rv.status_code == 200
    assert rv.json == expected_info

def test_service_info_error(client, mocker):
    """Test the service_info endpoint with an error."""
    mocker.patch('app.collect_service_info', side_effect=Exception('Test error'))
    rv = client.get('/info')
    assert rv.status_code == 500
    assert rv.json == {"error": "Failed to collect service 2 information."}
