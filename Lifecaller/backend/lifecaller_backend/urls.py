from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from atendimentos.views import AtendimentoViewSet
from atendimentos.views_coef import CoeficienteViewSet
from attachments.views import AttachmentViewSet
from core.views import HealthView, MeView

router = DefaultRouter()
router.register(r"atendimentos", AtendimentoViewSet, basename="atendimentos")
router.register(r"attachments", AttachmentViewSet, basename="attachments")
router.register(r"coeficientes", CoeficienteViewSet, basename="coeficientes")

urlpatterns = [
    # Health check
    path("", HealthView.as_view(), name="health"),

    # Admin
    path("admin/", admin.site.urls),

    # Authentication endpoints (both /api and /api/v1 prefixes for compatibility)
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair_v1"),
    path("api/v1/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh_v1"),

    # User info endpoint
    path("api/me/", MeView.as_view(), name="me"),
    path("api/v1/me/", MeView.as_view(), name="me_v1"),

    # API routes (both /api and /api/v1 prefixes for compatibility)
    path("api/", include(router.urls)),
    path("api/v1/", include(router.urls)),

    # Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
