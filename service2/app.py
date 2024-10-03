from flask import Flask, jsonify
import socket
import psutil
import time
import os
import logging

# Set up app and logging
logging.basicConfig(level=logging.INFO)
app = Flask(__name__)

app_start_time = time.time()

@app.route("/")
def is_alive():
    """Check if the service is alive (only for testing purposes in development)."""
    return "Service 2 alive!"

@app.route("/info")
def service_info():
    """Get service 2 information."""
    try:
        info = collect_service_info()
        return jsonify(info)
    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}")
        return jsonify({"error": "Failed to collect service 2 information."}), 500

#
# Utility Functions (in real cases, these would be in a separate module)
#

def collect_service_info() -> dict:
    """Collect service 2 information."""
    addresses = get_ip_address_information()
    processes = get_running_processes()
    disk_usage = get_disk_space()
    uptime = time.time() - app_start_time
    
    info = {
        "ipAddresses": addresses,
        "diskSpace": disk_usage,
        "processes": processes,
        "serviceUptime": uptime,
        "osUptime": time.time() - psutil.boot_time(),
    }

    return info


def get_ip_address_information() -> dict[str, list[str]]:
    """Get IP address information."""
    addresses = {}
    # Get all network interfaces
    for interface, addrs in psutil.net_if_addrs().items():
        for addr in addrs:
            # Skip over internal (i.e., 127.0.0.1 for IPv4 and ::1 for IPv6) addresses
            if (addr.family == socket.AF_INET and not addr.address.startswith('127.')) or \
               (addr.family == socket.AF_INET6 and not addr.address.startswith('::1')):
                if interface not in addresses:
                    addresses[interface] = []
                addresses[interface].append(addr.address)

    return addresses


def get_disk_space() -> dict[str, str]:
    """Get disk space information."""
    disk_usage = os.popen("df -h /").read().split("\n")
    headers = disk_usage[0].split()
    data = disk_usage[1].split()
    return dict(zip(headers, data))


def get_running_processes() -> list[dict]:
    """Get list of running processes."""
    processes = []
    lines = os.popen("ps -ax").read().split("\n")
    header = lines[0].split()
    for line in lines[1:]:
        if line.strip():  # Skip empty lines
            columns = line.split(None, len(header) - 1)
            process_info = dict(zip(header, columns))
            processes.append(process_info)

    return processes


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)