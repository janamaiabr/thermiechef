#!/usr/bin/env python3
"""Generate a food photo using various free image generation APIs"""
import urllib.request
import json
import sys
import os
import time

prompt = sys.argv[1] if len(sys.argv) > 1 else "Tahini chocolate cookies"
output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/gen_image.jpg"

# Try Creative Fabrica's free AI image generation or other free services
endpoints = [
    # Prodia free API
    {
        "url": "https://api.prodia.com/v1/sd/generate",
        "method": "GET",
        "params": {
            "prompt": prompt,
            "model": "deliberate_v3.safetensors [4f28c740]",
            "sampler": "DPM++ 2M Karras",
            "steps": 25,
            "cfg_scale": 7,
            "width": 1024,
            "height": 1024,
            "seed": 42,
        }
    },
]

# Prodia requires API key. Let's try other free options.
# Option 1: Try Segmind free tier
# Option 2: Use Stable Horde (free, community-powered)

# Stable Horde - free, community-powered
print("Trying Stable Horde...")
horde_url = "https://stablehorde.net/api/v2/generate/async"

payload = {
    "prompt": prompt,
    "params": {
        "steps": 30,
        "width": 1024,
        "height": 1024,
        "sampler_name": "k_euler",
        "cfg_scale": 7,
        "n": 1,
    },
    "nsfw": False,
    "models": ["SDXL 1.0"],
    "r2": True,
}

headers = {
    "Content-Type": "application/json",
    "apikey": "0000000000",  # Anonymous
    "Client-Agent": "ThermieChef/1.0"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(horde_url, data=data, headers=headers, method="POST")

try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read())
    request_id = result.get("id")
    if not request_id:
        print(f"No request ID: {result}")
        sys.exit(1)
    print(f"Request ID: {request_id}")
    
    # Poll for result
    status_url = f"https://stablehorde.net/api/v2/generate/check/{request_id}"
    for attempt in range(60):  # Wait up to 5 minutes
        time.sleep(5)
        status_req = urllib.request.Request(status_url, headers={"Client-Agent": "ThermieChef/1.0"})
        status_resp = urllib.request.urlopen(status_req, timeout=30)
        status = json.loads(status_resp.read())
        print(f"  Status: {status.get('wait_time', '?')}s wait, {status.get('queue_position', '?')} in queue, {status.get('done', 0)}/{status.get('processing', 0)+status.get('queue_position', 0)+status.get('done', 0)} done")
        if status.get("done"):
            break
    
    # Get result
    result_url = f"https://stablehorde.net/api/v2/generate/status/{request_id}"
    result_req = urllib.request.Request(result_url, headers={"Client-Agent": "ThermieChef/1.0"})
    result_resp = urllib.request.urlopen(result_req, timeout=30)
    result_data = json.loads(result_resp.read())
    
    generations = result_data.get("generations", [])
    if not generations:
        print(f"No generations: {json.dumps(result_data)[:500]}")
        sys.exit(1)
    
    img_url = generations[0].get("img")
    if not img_url:
        print(f"No image URL: {json.dumps(generations[0])[:300]}")
        sys.exit(1)
    
    print(f"Downloading image from: {img_url[:100]}...")
    img_resp = urllib.request.urlopen(img_url, timeout=60)
    img_data = img_resp.read()
    
    with open(output, "wb") as f:
        f.write(img_data)
    print(f"SUCCESS: Saved {len(img_data)} bytes to {output}")
    sys.exit(0)

except urllib.error.HTTPError as e:
    body = e.read().decode("utf-8", errors="replace")
    print(f"HTTP {e.code}: {body[:500]}")
except Exception as e:
    print(f"Error: {e}")

print("Stable Horde failed. Trying alternative approach...")

# Alternative: Use a free clipdrop or similar service
# As a last resort, use Python PIL to create a labeled placeholder
try:
    from PIL import Image, ImageDraw, ImageFont
    
    img = Image.new('RGB', (1024, 1024), color=(139, 90, 43))
    draw = ImageDraw.Draw(img)
    
    # Draw a plate-like circle
    draw.ellipse([200, 200, 824, 824], fill=(245, 235, 220), outline=(180, 160, 140), width=4)
    
    # Draw cookie shapes
    cookie_positions = [(320, 350), (520, 320), (420, 500), (600, 480), (350, 650), (550, 650)]
    for x, y in cookie_positions:
        draw.ellipse([x-50, y-30, x+50, y+30], fill=(60, 35, 20), outline=(45, 25, 15), width=2)
        # chocolate chips
        for cx, cy in [(x-15, y-8), (x+12, y+5), (x-5, y+12), (x+20, y-10)]:
            draw.ellipse([cx-6, cy-6, cx+6, cy+6], fill=(30, 18, 8))
    
    # Add text label
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
    except:
        font = ImageFont.load_default()
    
    draw.text((512, 100), "Tahini Chocolate Cookies", fill=(255, 255, 255), anchor="mt", font=font)
    draw.text((512, 924), "ThermieChef Recipe Photo", fill=(255, 255, 255), anchor="mt", font=font)
    
    img.save(output, "JPEG", quality=85)
    print(f"Created placeholder image: {output} ({os.path.getsize(output)} bytes)")
    sys.exit(0)
except ImportError:
    print("PIL not available for fallback.")
    sys.exit(1)