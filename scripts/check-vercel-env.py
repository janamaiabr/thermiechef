import json, subprocess, urllib.request

vercel_token = subprocess.run(['security', 'find-generic-password', '-s', 'jaspion-vercel', '-a', 'VERCEL_TOKEN', '-w'], capture_output=True, text=True).stdout.strip()

# First, find the project ID
req = urllib.request.Request('https://api.vercel.com/v9/projects?limit=100', headers={'Authorization': f'Bearer {vercel_token}'})
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())

# Find the thermiechef project
for proj in data.get('projects', []):
    if 'thermie' in proj.get('name', '').lower() or 'aly' in proj.get('name', '').lower():
        print(f"Project: {proj['name']} (ID: {proj['id']})")
        
        # Get env vars
        env_url = f"https://api.vercel.com/v9/projects/{proj['id']}/env?limit=100"
        env_req = urllib.request.Request(env_url, headers={'Authorization': f'Bearer {vercel_token}'})
        env_resp = urllib.request.urlopen(env_req)
        env_data = json.loads(env_resp.read())
        
        for e in env_data.get('envs', []):
            key = e.get('key', '')
            val = e.get('value', '') or ''
            print(f"  {key} = {val[:12]}..." if len(val) > 12 else f"  {key} = {val}")