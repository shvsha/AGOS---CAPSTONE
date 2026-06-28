"""
test_flow.py
=============
Tests the /api/sensor-readings/with-flow/ endpoint by sending
5 real canal photos as camera burst frames alongside a test water level.

Edit the CONFIG section before running.

Usage:
  python test_flow.py

Place 5 test images in the FRAMES list below — use any real canal
photos you have (from raw_photos_pure/ or raw_photos_mixed/).
"""

import requests
import json
import os

# ------------------------------------------------------------------
# CONFIG — edit these before running
# ------------------------------------------------------------------
BASE_URL     = "http://localhost:8000"
EMAIL     = "23100316@slc-sflu.edu.ph"
PASSWORD     = "admin123"
NODE_ID      = 2          # a valid node_id in your DB
WATER_LEVEL  = 50.0       # test water level in cm
READING_STATUS = "Normal"

# 5 real canal photos to use as burst frames
# Use any photos from your raw_photos_pure/ or raw_photos_mixed/ folders
FRAMES = [
    r"C:\Users\admin\Desktop\AGOS_PROJECT\ai_model\raw_photos\biodegradable\20260529_140543.jpg",
    r"C:\Users\admin\Desktop\AGOS_PROJECT\ai_model\raw_photos\biodegradable\20260603_164521.jpg",
    r"C:\Users\admin\Desktop\AGOS_PROJECT\ai_model\raw_photos\biodegradable\20260603_164759.jpg",
    r"C:\Users\admin\Desktop\AGOS_PROJECT\ai_model\raw_photos\biodegradable\20260603_171728.jpg",
    r"C:\Users\admin\Desktop\AGOS_PROJECT\ai_model\raw_photos\biodegradable\20260604_115020.jpg",
]
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


def test_flow(token):
    # Verify all frame files exist before sending
    for i, path in enumerate(FRAMES, 1):
        if not os.path.exists(path):
            print(f"Frame {i} not found: {path}")
            print("Update the FRAMES list in CONFIG to point to real photos.")
            return

    headers = {"Authorization": f"Bearer {token}"}

    # Build multipart form data
    data = {
        "node": NODE_ID,
        "water_level": WATER_LEVEL,
        "reading_status": READING_STATUS,
    }

    files = {}
    file_handles = []
    try:
        for i, path in enumerate(FRAMES, 1):
            f = open(path, "rb")
            file_handles.append(f)
            filename = os.path.basename(path)
            files[f"frame_{i}"] = (filename, f, "image/jpeg")

        print(f"\nSending to {BASE_URL}/api/sensor-readings/with-flow/")
        print(f"  node_id     : {NODE_ID}")
        print(f"  water_level : {WATER_LEVEL} cm")
        print(f"  frames      : {len(FRAMES)} photos")
        print()

        resp = requests.post(
            f"{BASE_URL}/api/sensor-readings/with-flow/",
            headers=headers,
            data=data,
            files=files,
        )
    finally:
        for f in file_handles:
            f.close()

    print(f"Status: {resp.status_code}")
    try:
        result = resp.json()
        print(json.dumps(result, indent=2))

        if resp.status_code == 201:
            print("\n--- Summary ---")
            print(f"  reading_id      : {result.get('reading_id')}")
            print(f"  water_level     : {result.get('water_level')} cm")
            print(f"  water_flow_rate : {result.get('water_flow_rate')} m/s")
            print(f"  water_flow      : {result.get('water_flow')}")
            print(f"  clog_pct        : {result.get('clog_pct')}%")
            print(f"  reading_status  : {result.get('reading_status')}")

            flow_rate = result.get('water_flow_rate')
            if flow_rate is None:
                print("\n  NOTE: water_flow_rate is null — optical flow returned")
                print("  no trackable features in these photos. This is expected")
                print("  if using static/similar photos instead of real video frames.")
                print("  Try photos with visible moving debris or water surface texture.")
            else:
                print(f"\n  Optical flow computed successfully: {flow_rate:.4f} m/s")

    except Exception:
        print(resp.text)


if __name__ == "__main__":
    token = get_token()
    if token:
        test_flow(token)
