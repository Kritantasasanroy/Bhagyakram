import urllib.request
import json

req = urllib.request.Request('https://api.render.com/v1/services/srv-d8i7ct37uimc73afgu8g/deploys?limit=1', headers={'Authorization': 'Bearer rnd_C9035r5AmFhXQ3xiVYytpu3W26QV', 'Accept': 'application/json'})
data = json.loads(urllib.request.urlopen(req).read().decode())
print(f"Status: {data[0]['deploy']['status']}, Created: {data[0]['deploy']['createdAt']}")
