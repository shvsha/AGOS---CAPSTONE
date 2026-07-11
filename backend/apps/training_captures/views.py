from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import TrainingCapture
from .serializers import TrainingCaptureSerializer
from apps.users.permissions import IoTDeviceAuthentication, IsIoTDevice

class TrainingCaptureUploadView(APIView):
    authentication_classes = [IoTDeviceAuthentication]
    permission_classes = [IsIoTDevice]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response(
                {'error': 'No image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        capture = TrainingCapture.objects.create(
            session_label=request.data.get('session', ''),
            image=image,
            latitude=request.data.get('latitude'),
            longitude=request.data.get('longitude'),
        )

        return Response(
            TrainingCaptureSerializer(capture, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )