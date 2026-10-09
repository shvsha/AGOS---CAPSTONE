import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "agos_backend.settings")
django.setup()

from apps.ai_inference.inference import run_ai_classification

TEST_IMAGE = r"C:\Users\admin\Downloads\255354507_580373036397643_4486679365523229765_n.jpg"

with open(TEST_IMAGE, "rb") as f:
    image_bytes = f.read()

result = run_ai_classification(image_bytes)
print(result)

import numpy as np, cv2
from apps.ai_inference import inference as inf

arr = np.frombuffer(image_bytes, dtype=np.uint8)
img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
print("decoded:", None if img is None else img.shape)

session = inf._get_yolo_model()
print("input:", session.get_inputs()[0].shape, "output:", session.get_outputs()[0].shape)

blob, _ = inf._preprocess_yolo(img)
out = session.run(None, {session.get_inputs()[0].name: blob})[0][0].T
scores = out[:, 4:]
print("best score per class:", dict(zip(inf.YOLO_CLASS_NAMES, scores.max(axis=0).round(2))))