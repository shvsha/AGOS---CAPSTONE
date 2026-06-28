"""
test_classify.py
=================
Quick test script for the waste classification endpoint.
Run from anywhere inside AGOS_PROJECT:
  python test_classify.py

Edit the variables in the CONFIG section below before running.
"""

import requests

# ------------------------------------------------------------------
# CONFIG — edit these before running
# ------------------------------------------------------------------
BASE_URL   = "http://localhost:8000"
EMAIL     = "23100316@slc-sflu.edu.ph"
PASSWORD   = "admin123"             # your admin password
IMAGE_PATH = r"C:\Users\admin\Desktop\pat basura\IMG_20260621_171132_426.jpg"  # full path to a test image
NODE_ID    = 2                         # a valid node_id in your DB
READING_ID = 248                         # a valid reading_id with no classification yet
# ------------------------------------------------------------------


def get_token():
    resp = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"email": EMAIL, "password": PASSWORD},  # ← change "username" to "email"
    )
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code} {resp.text}")
        return None
    token = resp.json().get("access")
    print(f"Logged in. Token: {token[:30]}...")
    return token


def classify(token, image_path, node_id, reading_id):
    headers = {"Authorization": f"Bearer {token}"}
    with open(image_path, "rb") as f:
        files   = {"image": (image_path.split("\\")[-1], f, "image/jpeg")}
        data    = {"node_id": node_id, "reading_id": reading_id}
        resp = requests.post(
            f"{BASE_URL}/api/waste-classifications/classify/",
            headers=headers,
            files=files,
            data=data,
        )
    print(f"\nStatus: {resp.status_code}")
    try:
        import json
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)


if __name__ == "__main__":
    token = get_token()
    if token:
        classify(token, IMAGE_PATH, NODE_ID, READING_ID)