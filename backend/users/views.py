from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import login, logout
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth.hashers import check_password
from django.core.paginator import Paginator
from django.db.models import Q
from .serializers import UserSerializer, LoginSerializer, UserUpdateSerializer, ChangePasswordSerializer
from .models import User


def is_admin_user(user):
    """Check if user has admin role"""
    return user.role == 'admin'


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Automatically set status to active on signup
        user.status = 'inactive'
        user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_view(request):
    try:
        # Get the refresh token from the request
        refresh_token = request.data.get('refresh')

        if refresh_token:
            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

        # Also logout the session (if using sessions)
        logout(request)

        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Failed to logout'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
def manage_current_user(request):
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        user = request.user
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def change_password(request):
    user = request.user
    serializer = ChangePasswordSerializer(data=request.data)

    if serializer.is_valid():
        old_password = serializer.validated_data.get('old_password')
        new_password = serializer.validated_data.get('new_password')

        # Check if old password is correct
        if not check_password(old_password, user.password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password changed successfully'})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Admin endpoints
@api_view(['GET'])
def list_users(request):
    # Check if user is admin
    if not is_admin_user(request.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    # Get page number from query parameters, default to 1
    page = request.query_params.get('page', 1)

    # Get search query from query parameters
    search = request.query_params.get('search', '')

    # Get all users
    users = User.objects.all()

    # Apply search filter if search query is provided
    if search:
        users = users.filter(
            Q(email__icontains=search) |
            Q(full_name__icontains=search)
        ).order_by('id')
    else:
        users = users.order_by('id')

    # Paginate users (10 per page as specified)
    paginator = Paginator(users, 10)
    paginated_users = paginator.get_page(page)

    serializer = UserSerializer(paginated_users, many=True)

    # Return paginated response
    return Response({
        'users': serializer.data,
        'total_pages': paginator.num_pages,
        'current_page': int(page),
        'total_users': paginator.count
    })


@api_view(['PATCH'])
def activate_user(request, user_id):
    # Check if user is admin
    if not is_admin_user(request.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user.status = 'active'
    user.save()

    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['PATCH'])
def deactivate_user(request, user_id):
    # Check if user is admin
    if not is_admin_user(request.user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user.status = 'inactive'
    user.save()

    serializer = UserSerializer(user)
    return Response(serializer.data)
