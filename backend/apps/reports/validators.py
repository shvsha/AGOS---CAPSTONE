import os
from PIL import Image, UnidentifiedImageError
from pillow_heif import register_heif_opener
from rest_framework.exceptions import ValidationError
from io import BytesIO
from django.core.files.base import ContentFile


register_heif_opener()

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_upload(file, expected_kind='Image'):
    """
    Validates an uploaded report photo. Raises
    rest_framework.exceptions.ValidationError on failure.
    Rewinds the file pointer before returning so the caller can
    still .save() it normally afterward.
    """
    if expected_kind != 'Image':
        raise ValidationError('Only image uploads are supported for reports.')

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(f'Unsupported image extension: {ext}')

    if file.size > MAX_IMAGE_SIZE:
        raise ValidationError('Image file is too large (max 10MB).')

    try:
        file.seek(0)
        img = Image.open(file)
        img.verify()  # raises if the bytes aren't actually a real image
    except (UnidentifiedImageError, OSError):
        raise ValidationError('File is not a valid image.')
    finally:
        file.seek(0)  # rewind so it can still be saved afterward


def convert_heic_to_jpeg(file):
    """
    Converts a HEIC/HEIF UploadedFile into a JPEG ContentFile Django can
    save normally. Call this AFTER validate_upload() has already
    confirmed the file is a genuine image.
    """
    file.seek(0)
    image = Image.open(file)
    image = image.convert('RGB')  # HEIC can carry color modes JPEG doesn't support

    buffer = BytesIO()
    image.save(buffer, format='JPEG', quality=90)
    buffer.seek(0)

    base_name = os.path.splitext(file.name)[0]
    return ContentFile(buffer.read(), name=f'{base_name}.jpg')