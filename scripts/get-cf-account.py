import json, subprocess, urllib.request

cf_token = subprocess.run(['security', 'find-generic-password', '-s', 'jaspion-cloudflare', '-a', 'CLOUDFLARE_API_TOKEN', '-w'], capture_output=True, text=True).stdout.strip()

req = urllib.request.Request('https://api.cloudflare.com/client/v4/accounts', headers={'Authorization': f'Bearer {cf_token}'})
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
print(json.dumps(data, indent=2)[:1000])