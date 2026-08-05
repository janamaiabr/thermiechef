#!/usr/bin/env python3
"""Generate a food photo locally using Stable Diffusion via diffusers"""
import os
import sys
from pathlib import Path

# Suppress unnecessary warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

PROMPT = """Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. 
A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, 
sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. 
High quality, realistic, appetising food photography. No text, no logos, no hands, no people, no watermark"""

NEGATIVE_PROMPT = """text, logo, watermark, hands, person, cartoon, illustration, painting, drawing, 
sketch, blurry, low quality, distorted, deformed, ugly, bad anatomy, Thermomix machine, packaging"""

OUTPUT = "assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg"

def main():
    from diffusers import StableDiffusionXLPipeline
    import torch
    from PIL import Image
    
    print("Loading Stable Diffusion XL pipeline...")
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True,
    )
    pipe = pipe.to("mps")  # Apple Silicon MPS
    pipe.enable_attention_slicing()
    
    print("Generating image...")
    image = pipe(
        prompt=PROMPT,
        negative_prompt=NEGATIVE_PROMPT,
        num_inference_steps=25,
        guidance_scale=7.5,
        width=1024,
        height=1024,
        seed=42,
    ).images[0]
    
    # Save as JPEG
    output_path = Path(OUTPUT)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(str(output_path), "JPEG", quality=90)
    
    size = output_path.stat().st_size
    print(f"Saved: {output_path} ({size} bytes)")
    
    if size < 10000:
        print(f"WARNING: Image is only {size} bytes, may be too small")
        sys.exit(1)
    
    print("SUCCESS!")

if __name__ == "__main__":
    main()