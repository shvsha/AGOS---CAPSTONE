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