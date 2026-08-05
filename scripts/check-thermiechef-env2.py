import json, subprocess, urllib.request

vercel_token = subprocess.run(['security', 'find-generic-password', '-s', 'jaspion-vercel', '-a', 'VERCEL_TOKEN', '-w'], capture_output=True, text=True).stdout.strip()

# Get env vars for thermiechef project  
project_id = "prj_RpGboRayWuN5oWgchtm5INIfU19U"
env_url = f"https://api.vercel.com/v9/projects/{project_id}/env?limit=100"
env_req = urllib.request.Request(env_url, headers={'Authorization': f'Bearer {vercel_token}'})
env_resp = urllib.request.urlopen(env_req)
env_data = json.loads(env_resp.read())

print(json.dumps(env_data, indent=2)[:3000])