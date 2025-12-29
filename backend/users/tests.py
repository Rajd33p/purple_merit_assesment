from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_user_signup(self):
        """Test user can sign up and account is inactive by default"""
        response = self.client.post(reverse('signup'), {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'password': 'testpassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['status'], 'inactive')

    def test_user_login_active_account(self):
        """Test user can login with active account"""
        # Create an active user
        User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='testpassword123',
            status='active'
        )

        response = self.client.post(reverse('login'), {
            'email': 'test@example.com',
            'password': 'testpassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_user_login_inactive_account_fails(self):
        """Test login fails for inactive account"""
        User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='testpassword123',
            status='inactive'
        )

        response = self.client.post(reverse('login'), {
            'email': 'test@example.com',
            'password': 'testpassword123'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserManagementTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            full_name='Test User',
            password='testpassword123',
            status='active'
        )
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_get_user_profile(self):
        """Test user can get their profile"""
        response = self.client.get(reverse('manage_current_user'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_update_user_profile(self):
        """Test user can update their profile"""
        response = self.client.put(reverse('manage_current_user'), {
            'full_name': 'Updated Name'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], 'Updated Name')


class AdminTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create admin user
        self.admin = User.objects.create_user(
            email='admin@example.com',
            full_name='Admin User',
            password='adminpass123',
            role='admin',
            status='active'
        )
        # Create regular user
        self.user = User.objects.create_user(
            email='user@example.com',
            full_name='Regular User',
            password='userpass123',
            role='user',
            status='inactive'
        )
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_admin_can_list_users(self):
        """Test admin can list users"""
        response = self.client.get(reverse('list_users'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_activate_user(self):
        """Test admin can activate user"""
        url = reverse('activate_user', kwargs={'user_id': self.user.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'active')

    def test_admin_can_deactivate_user(self):
        """Test admin can deactivate user"""
        # First activate the user
        self.user.status = 'active'
        self.user.save()

        url = reverse('deactivate_user', kwargs={'user_id': self.user.id})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.status, 'inactive')