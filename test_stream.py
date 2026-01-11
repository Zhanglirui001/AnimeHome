import requests
import json
import time

url = "http://localhost:8000/chat/"
payload = {
    "messages": [{"role": "user", "content": "Hello, tell me a long story."}],
    "systemPrompt": "You are a helpful assistant."
}

print("Sending request...")
start_time = time.time()
with requests.post(url, json=payload, stream=True) as r:
    print(f"Response status: {r.status_code}")
    print(f"Headers: {r.headers}")
    print("Reading stream...")
    for chunk in r.iter_content(chunk_size=None):
        if chunk:
            print(f"[{time.time() - start_time:.2f}s] Chunk: {repr(chunk.decode('utf-8'))}")

print("Done.")