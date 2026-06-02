from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WasteClassification
from .serializers import WasteClassificationSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay
import sys
import os

class WasteClassificationListView(generics.ListCreateAPIView):
    serializer_class = WasteClassificationSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        return [IsAdmin()] 

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return WasteClassification.objects.filter(
                node__barangay=user.barangay
            ).order_by('-timestamp')
        return WasteClassification.objects.all().order_by('-timestamp')

class WasteClassificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WasteClassification.objects.all()
    serializer_class = WasteClassificationSerializer
    lookup_field = 'classification_id'
    permission_classes = [IsAdmin]


class ClassifyWasteView(APIView):
    """
    Receives an image from ESP32-CAM
    Runs it through the AI model
    Saves the classification result
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        node_id = request.data.get('node_id')
        reading_id = request.data.get('reading_id')

        if not image_file:
            return Response(
                {'error': 'No image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not node_id or not reading_id:
            return Response(
                {'error': 'node_id and reading_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Save image temporarily
            temp_path = f'media/temp_{image_file.name}'
            with open(temp_path, 'wb') as f:
                for chunk in image_file.chunks():
                    f.write(chunk)

            # Load classifier
            ai_model_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                'ai_model'
            )
            sys.path.append(ai_model_path)
            from classifier import classify_waste

            # Run classification
            result = classify_waste(temp_path)

            # Clean up temp file
            os.remove(temp_path)

            if not result['success']:
                return Response(
                    {'error': result.get('error', 'Classification failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Save to database
            from apps.sensor_nodes.models import SensorNode
            from apps.sensor_readings.models import SensorReading

            node = SensorNode.objects.get(node_id=node_id)
            reading = SensorReading.objects.get(reading_id=reading_id)

            classification = WasteClassification.objects.create(
                node=node,
                reading=reading,
                waste_type=result['waste_type'].capitalize(),
                estimated_volume=0.0  # Volume estimated separately
            )

            return Response(
                WasteClassificationSerializer(classification).data,
                status=status.HTTP_201_CREATED
            )

        except SensorNode.DoesNotExist:
            return Response(
                {'error': 'Sensor node not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except SensorReading.DoesNotExist:
            return Response(
                {'error': 'Sensor reading not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )