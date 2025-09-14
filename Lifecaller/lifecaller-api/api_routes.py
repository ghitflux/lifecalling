from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Placeholder views para as rotas mencionadas
@api_view(['GET'])
def simulations_list(request):
    return Response({"message": "Simulations API endpoint"})

@api_view(['GET'])
def coefficients_list(request):
    return Response({"message": "Coefficients API endpoint"})

@api_view(['GET'])
def contratos_finais_list(request):
    return Response({"message": "Contratos Finais API endpoint"})

# URL patterns que serão incluídos nas rotas principais
urlpatterns = [
    path('simulations/', simulations_list, name='simulations-list'),
    path('coefficients/', coefficients_list, name='coefficients-list'),
    path('contratos-finais/', contratos_finais_list, name='contratos-finais-list'),
]