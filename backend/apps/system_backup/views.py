import os
import tempfile
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser

from apps.users.permissions import IsAdmin
from .services import create_backup_archive, restore_backup_archive
from .models import BackupLog, BackupConfig
from .serializers import BackupConfigSerializer, BackupLogSerializer


class ManualBackupView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        tmp_dir = tempfile.mkdtemp()
        try:
            archive_path = create_backup_archive(tmp_dir)
            file_name = os.path.basename(archive_path)

            BackupLog.objects.create(
                backup_type='manual',
                status='success',
                triggered_by=request.user,
                file_name=file_name,
            )

            response = FileResponse(
                open(archive_path, 'rb'),
                as_attachment=True,
                filename=file_name,
            )
            return response

        except Exception as e:
            BackupLog.objects.create(
                backup_type='manual',
                status='failed',
                triggered_by=request.user,
                error_message=str(e),
            )
            return Response(
                {'error': f'Backup failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RestoreBackupView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded_file = request.FILES.get('backup_file')

        if not uploaded_file:
            return Response(
                {'error': 'No backup file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not uploaded_file.name.endswith('.zip'):
            return Response(
                {'error': 'Invalid file type. Expected a .zip backup archive.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tmp_dir = tempfile.mkdtemp()
        tmp_zip_path = os.path.join(tmp_dir, uploaded_file.name)

        try:
            with open(tmp_zip_path, 'wb') as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)

            restore_backup_archive(tmp_zip_path)

            BackupLog.objects.create(
                backup_type='restore',
                status='success',
                triggered_by=request.user,
                file_name=uploaded_file.name,
            )

            return Response({'message': 'System restored successfully.'})

        except Exception as e:
            BackupLog.objects.create(
                backup_type='restore',
                status='failed',
                triggered_by=request.user,
                file_name=uploaded_file.name,
                error_message=str(e),
            )
            return Response(
                {'error': f'Restore failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BackupConfigView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        config, _ = BackupConfig.objects.get_or_create(config_id=1)
        serializer = BackupConfigSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        config, _ = BackupConfig.objects.get_or_create(config_id=1)

        server_path = request.data.get('server_backup_path')
        if server_path is not None and server_path != '':
            if not os.path.isdir(server_path):
                return Response(
                    {'error': f'Path does not exist or is not a folder: {server_path}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not os.access(server_path, os.W_OK):
                return Response(
                    {'error': f'Path is not writable: {server_path}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = BackupConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BackupLogListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = BackupLog.objects.all().order_by('-created_at')[:20]
        serializer = BackupLogSerializer(logs, many=True)
        return Response(serializer.data)