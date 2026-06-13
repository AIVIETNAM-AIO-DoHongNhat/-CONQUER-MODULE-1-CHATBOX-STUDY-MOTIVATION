from django.urls import path
from authentication.views.login_view import LoginView
from authentication.views.register_view import RegisterView
from authentication.views.user_view import UserView
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views.verify_email_view import VerifyEmailView
from authentication.views.logout_view import LogoutView
from authentication.views.resend_otp_view import ResendOtpView
from authentication.views.reset_password_view import ResetPasswordView
from authentication.views.update_profile_view import UpdateProfileView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path('refresh-token/', TokenRefreshView.as_view(), name='refresh-token'),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("user/", UserView.as_view({'get': 'list'}), name="user"),
    path("user/profile/", UserView.as_view({'get': 'profile'}), name="user-profile"),
    path("user/<int:pk>/", UserView.as_view({'get': 'retrieve'}), name="user-by-id"),
    path("logout/", LogoutView.as_view(), name='logout'),
    path("user/profile/update/", UpdateProfileView.as_view(), name="update-profile"),
    path("resend-otp/", ResendOtpView.as_view(), name="resend-otp"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
]
