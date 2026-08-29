from storages.backends.s3 import S3Storage
from django.conf import settings


class SupabasePublicStorage(S3Storage):
    """
    django-storages' S3Storage generates URLs against Supabase's S3-compatible
    endpoint (/storage/v1/s3/...), which requires a signed request even for
    'public' buckets. Supabase's actual public-serving URLs use a different
    path (/storage/v1/object/public/...). This override builds URLs in that
    format instead, so files are directly accessible without signing.
    """
    def url(self, name, parameters=None, expire=None, http_method=None):
        supabase_project_url = settings.SUPABASE_PROJECT_URL.rstrip('/')
        bucket_name = self.bucket_name
        return f"{supabase_project_url}/storage/v1/object/public/{bucket_name}/{name}"