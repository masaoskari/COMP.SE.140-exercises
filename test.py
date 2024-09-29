str = "asd asd2 asd3"

print(str.split())

""" def get_ip_address_information():

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

    return addresses """
