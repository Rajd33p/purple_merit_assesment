from django.urls import path
from . import views

urlpatterns = [
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/me/', views.get_user, name='get_user'),

    # User endpoints
    path('users/me/', views.manage_current_user, name='manage_current_user'),  # GET/PUT
    path('users/me/password/', views.change_password, name='change_password'),  # PUT
]