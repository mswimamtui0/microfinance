# branches/views.py
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from .models import Branch
from .serializers import BranchSerializer

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.filter(is_active=True)
    serializer_class = BranchSerializer
    permission_classes = [permissions.AllowAny]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        print(f"📊 Fetching branches...")
        print(f"📊 Found {queryset.count()} active branches")
        print(f"📤 Returning branches: {serializer.data}")
        return Response(serializer.data)