import urllib.request
import json
import ssl

url = 'https://bhagyakram-backend.onrender.com/api/auth/login'
data = json.dumps({'email': 'test@test.com', 'password': 'wrong'}).encode()
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}, method='POST')

try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, timeout=10, context=context) as response:
        print("Status:", response.status)
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
