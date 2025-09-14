from django.contrib.auth import authenticate, get_user_model
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import UserSerializer

User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")
        if not username or not password:
            return Response({"detail":"Missing credentials"}, status=status.HTTP_400_BAD_REQUEST)

        # permite login por username OU email
        user = authenticate(request, username=username, password=password)
        if not user:
            try:
                u = User.objects.get(email=username)
            except User.DoesNotExist:
                u = None
            if u:
                user = authenticate(request, username=u.username, password=password)

        if not user:
            return Response({"detail":"Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        ser = TokenObtainPairSerializer(data={"username": user.username, "password": password})
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        data["user"] = UserSerializer(user).data
        return Response(data, status=200)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data, status=200)