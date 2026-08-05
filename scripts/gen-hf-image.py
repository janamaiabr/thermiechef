#!/usr/bin/env python3
"""Generate a food photo using HuggingFace Inference API"""
import urllib.request
import json
import sys
import os
import ssl

prompt = sys.argv[1] if len(sys.argv) > 1 else "Tahini chocolate cookies"
output = sys.argv[2] if len(sys.argv) > 2 else "/tmp/hf_image.jpg"

ctx = ssl.create_default_context()

# Use the correct HuggingFace inference endpoint format
models_and_endpoints = [
    ("stabilityai/stable-diffusion-xl-base-1.0", "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"),
    ("black-forest-labs/FLUX.1-schnell", "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"),
    ("stabilityai/stable-diffusion-xl-base-1.0", "https://huggingface.co/api/inference/stabilityai/stable-diffusion-xl-base-1.0"),
]

hf_token = os.environ.get("HF_API_TOKEN", "")

for model_name, url in models_and_endpoints:
    print(f"Trying {model_name} via {url}...")
    
    headers = {"Content-Type": "application/json"}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
    
    data = json.dumps({
        "inputs": prompt,
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    
    try:
        resp = urllib.request.urlopen(req, timeout=120, context=ctx)
        content_type = resp.headers.get("Content-Type", "")
        body = resp.read()
        
        if "image" in content_type or len(body) > 10000:
            with open(output, "wb") as f:
                f.write(body)
            print(f"SUCCESS: Saved {len(body)} bytes to {output}")
            print(f"Content-Type: {content_type}")
            sys.exit(0)
        else:
            print(f"  Unexpected response: {content_type}, {len(body)} bytes")
            print(f"  Body: {body[:500]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"  HTTP {e.code}: {body[:500]}")
    except Exception as e:
        print(f"  Error: {e}")

print("All HuggingFace endpoints failed.")
sys.exit(1)