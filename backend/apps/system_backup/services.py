import os
import subprocess
import zipfile
import tempfile
from datetime import datetime
from django.conf import settings


def create_backup_archive(output_dir):
    """
    Creates a single .zip backup archive containing:
      - a PostgreSQL dump (via pg_dump)
      - a copy of the media/report_media folder

    output_dir: folder where the final .zip should be written
                (admin's chosen path for manual, or configured server
                path for scheduled — decided by the caller, not this function)

    Returns the full path to the created archive.
    Raises an exception if anything fails (caller is responsible for
    catching it and logging to BackupLog).
    """
    timestamp = datetime.now().strftime('%Y-%m-%d_%H%M')
    archive_name = f"agos_backup_{timestamp}.zip"
    archive_path = os.path.join(output_dir, archive_name)

    db_settings = settings.DATABASES['default']

    with tempfile.TemporaryDirectory() as tmp_dir:
        # 1. Dump the database to a .sql file
        dump_path = os.path.join(tmp_dir, 'database.sql')

        env = os.environ.copy()
        env['PGPASSWORD'] = db_settings['PASSWORD']

        result = subprocess.run(
          [
              'pg_dump',
              '-h', db_settings['HOST'],
              '-p', str(db_settings['PORT']),
              '-U', db_settings['USER'],
              '-F', 'p',
              '--clean',
              '--if-exists',
              '-f', dump_path,
              db_settings['NAME'],
          ],
          env=env,
          capture_output=True,
          text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(f"pg_dump failed: {result.stderr}")

        # 2. Build the zip: db dump + media files
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(dump_path, arcname='database.sql')

            media_root = settings.MEDIA_ROOT
            report_media_dir = os.path.join(media_root, 'report_media')
            
            # 3. Add AI model weights (if present)
            mobilenet_path = os.path.join(settings.BASE_DIR.parent, 'ai_model', 'saved_model', 'waste_classifier.keras')
            yolo_path = os.path.join(settings.BASE_DIR, 'apps', 'waste_classification', 'weights', 'waste_yolo.pt')

            if os.path.exists(mobilenet_path):
                zf.write(mobilenet_path, arcname='models/waste_classifier.keras')
            else:
                print("Warning: MobileNetV2 weights not found, skipping.")

            if os.path.exists(yolo_path):
                zf.write(yolo_path, arcname='models/waste_yolo.pt')
            else:
                print("Warning: YOLO weights not found, skipping (this is expected if not yet trained).")

            if os.path.exists(report_media_dir):
                for root, dirs, files in os.walk(report_media_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, media_root)
                        zf.write(file_path, arcname=os.path.join('media', arcname))

    return archive_path


def restore_backup_archive(zip_path):
    """
    Restores the system from a previously created backup archive:
      - runs the database.sql dump against the current DB
      - overwrites report_media/ files with the ones from the archive
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        with zipfile.ZipFile(zip_path, 'r') as zf:
            names = zf.namelist()
            if 'database.sql' not in names:
                raise ValueError("Invalid backup file: database.sql not found in archive.")
            zf.extractall(tmp_dir)

        dump_path = os.path.join(tmp_dir, 'database.sql')
        db_settings = settings.DATABASES['default']

        env = os.environ.copy()
        env['PGPASSWORD'] = db_settings['PASSWORD']

        result = subprocess.run(
            [
                'psql',
                '-h', db_settings['HOST'],
                '-p', str(db_settings['PORT']),
                '-U', db_settings['USER'],
                '-d', db_settings['NAME'],
                '-f', dump_path,
            ],
            env=env,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(f"psql restore failed: {result.stderr}")

        # Restore media files
        extracted_media = os.path.join(tmp_dir, 'media')
        if os.path.exists(extracted_media):
            import shutil
            for root, dirs, files in os.walk(extracted_media):
                for file in files:
                    src = os.path.join(root, file)
                    rel_path = os.path.relpath(src, extracted_media)
                    dest = os.path.join(settings.MEDIA_ROOT, rel_path)
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    shutil.copy2(src, dest)