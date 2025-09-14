from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def ping(_):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("admin/", admin.site.urls),

    # -------- v1 (padrão novo) --------
    path("api/v1/ping/", ping),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema-v1"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="schema-v1"), name="swagger-v1"),
    path("api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema-v1"), name="redoc-v1"),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair_v1"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh_v1"),
    # DUPLICAÇÃO: Include de api_routes para v1
    path("api/v1/", include("api_routes")),
    # Include accounts para v1
    path("api/v1/", include("accounts.urls")),

    # -------- compat (/api) -----------
    path("api/ping/", ping),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # MESMA inclusão do router que já existe hoje:
    path("api/", include("api_routes")),
    # Include accounts para compatibilidade
    path("api/", include("accounts.urls")),
]