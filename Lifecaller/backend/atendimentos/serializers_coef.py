from rest_framework import serializers

from .models_coef import Coeficiente


class CoeficienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coeficiente
        fields = ["id", "banco", "parcelas", "coeficiente"]
