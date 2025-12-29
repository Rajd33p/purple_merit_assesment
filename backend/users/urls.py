from django.urls import path
from . import views

urlpatterns = [
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.get_user, name='get_user'),
]