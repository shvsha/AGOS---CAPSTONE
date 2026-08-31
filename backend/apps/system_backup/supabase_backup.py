import boto3
from django.conf import settings

def _get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )


def upload_backup_to_supabase(local_file_path: str, file_name: str):
    client = _get_s3_client()
    client.upload_file(local_file_path, settings.SUPABASE_S3_BACKUP_BUCKET, file_name)
    return file_name


def list_supabase_backups():
    client = _get_s3_client()
    response = client.list_objects_v2(Bucket=settings.SUPABASE_S3_BACKUP_BUCKET)
    entries = []
    for obj in response.get('Contents', []):
        key = obj['Key']
        if key.endswith('/'):
            continue
        entries.append({
            'file_name': key,
            'size_bytes': obj['Size'],
            'modified_at': obj['LastModified'].isoformat(),
        })
    entries.sort(key=lambda e: e['modified_at'], reverse=True)
    return entries


def download_backup_from_supabase(file_name: str, dest_path: str):
    client = _get_s3_client()
    client.download_file(settings.SUPABASE_S3_BACKUP_BUCKET, file_name, dest_path)