# customers/serializers.py
from rest_framework import serializers
from .models import Customer, Guarantor

class GuarantorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guarantor
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    guarantors = GuarantorSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = '__all__'
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"