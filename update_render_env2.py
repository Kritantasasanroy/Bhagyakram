import urllib.request
import json
import sys

API_KEY = "rnd_C9035r5AmFhXQ3xiVYytpu3W26QV"
SERVICE_ID = "srv-d8i7ct37uimc73afgu8g"
URL = f"https://api.render.com/v1/services/{SERVICE_ID}/env-vars"

payload = [
    {"key": "PYTHON_VERSION", "value": "3.11.0"},
    {"key": "NEON_DATABASE_URL", "value": "postgresql://neondb_owner:npg_U4lX1zkcvZyH@ep-shy-cell-a76hyehw.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"},
    {"key": "SECRET_KEY", "value": "aradhna_super_secret_generated_key_12345_!@#"},
    {"key": "GEMINI_API_KEY", "value": "AIzaSyDrfR4pSBWowSNZhygUA4UjRFi86YDq_AQ"}
]

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(URL, data=data, headers={
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}, method="PUT")

try:
    with urllib.request.urlopen(req) as response:
        resp_data = json.loads(response.read().decode())
        print("Successfully updated Render environment variables!")
except Exception as e:
    print(f"Error: {e}")
