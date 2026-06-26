from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import WasteClassification
from .serializers import WasteClassificationSerializer
from apps.users.permissions import IsAdminOrMENROOrBarangay, IsIoTDevice, IoTDeviceAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
import sys
import os



class WasteClassificationListView(generics.ListCreateAPIView):
    serializer_class = WasteClassificationSerializer

    # def get_permissions(self):
    #     if self.request.method == 'GET':
    #         return [IsAdminOrMENROOrBarangay()]
    #     return [IsIoTDevice()]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        # Allow both IoT device AND Admin (for testing)
        return [IsIoTDevice() if self.request.auth is None else IsAdminOrMENROOrBarangay()]

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
    permission_classes = [IsIoTDevice]


class ClassifyWasteView(APIView):
    """
    Receives an image from ESP32-CAM (as bytes or file)
    Runs it through the AI model
    Saves the classification result
    """
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]
    permission_classes = [IsIoTDevice | IsAdminOrMENROOrBarangay]

    def post(self, request):
        image_file = request.FILES.get('image')
        node_id    = request.data.get('node_id')
        reading_id = request.data.get('reading_id')
        estimated_volume = request.data.get('estimated_volume', 0.0)

        if not image_file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        if not node_id or not reading_id:
            return Response({'error': 'node_id and reading_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Load classifier
            ai_model_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                'ai_model'
            )
            if ai_model_path not in sys.path:
                sys.path.append(ai_model_path)
            from classifier import classify_mixed_from_bytes

            image_bytes = image_file.read()
            result = classify_mixed_from_bytes(image_bytes)

            if not result['success']:
                return Response(
                    {'error': result.get('error', 'Classification failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Save to database
            from apps.sensor_nodes.models import SensorNode
            from apps.sensor_readings.models import SensorReading

            node    = SensorNode.objects.get(node_id=node_id)
            reading = SensorReading.objects.get(reading_id=reading_id)
            percentages = result.get('percentages', {})

            classification = WasteClassification.objects.create(
                node=node,
                reading=reading,
                dominant_waste_type=result['dominant_waste_type'].replace('_', ' ').title(),
                recyclable_pct=percentages.get('recyclable', 0),
                biodegradable_pct=percentages.get('biodegradable', 0),
                residual_pct=percentages.get('residual', 0),
                special_waste_pct=percentages.get('special_waste', 0),
                none_pct=percentages.get('none', 0),
                confidence=result['confidence'],
                estimated_volume=float(estimated_volume),
                is_mixed=result.get('is_mixed', False),
                present_waste_types=result.get('present_waste_types', []),
            )

            return Response(
                WasteClassificationSerializer(classification).data,
                status=status.HTTP_201_CREATED
            )

        except SensorNode.DoesNotExist:
            return Response({'error': 'Sensor node not found'}, status=status.HTTP_404_NOT_FOUND)
        except SensorReading.DoesNotExist:
            return Response({'error': 'Sensor reading not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)