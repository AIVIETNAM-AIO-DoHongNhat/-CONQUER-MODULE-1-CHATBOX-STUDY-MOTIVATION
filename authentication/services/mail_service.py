from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from core.exceptions import InternalServerErrorException
from core.logger import log_info, log_error


class MailService:
    def __init__(self):
        pass

    def send_otp_email(
        self,
        email,
        otp,
        expiry_minutes,
        email_heading=None,
        action_description=None,
        subject=None,
    ):
        try:
            log_info(f"Sending OTP email to {email}")
            email_heading = email_heading or "Verify Your Account"
            action_description = action_description or "Please use the verification code below to complete the process and activate your account."
            subject = subject or email_heading
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = [email]

            context = {
                "email_subject": subject,
                "email": email,
                "email_heading": email_heading,
                "action_description": action_description,
                "otp_code": otp,
                "expiry_minutes": expiry_minutes,
                "project_name": "OwlVerse",
                "app_logo": settings.APP_LOGO,
            }

            html_content = render_to_string("emails/otp_email_template.html", context)
            msg = EmailMultiAlternatives(
                subject=subject,
                body=f"Your OTP code is: {otp}",
                from_email=from_email,
                to=to_email,
            )
            msg.attach_alternative(html_content, "text/html")
            send_result = msg.send()
            log_info(f"OTP email sent successfully to {email}. result={send_result}")
            return send_result
        except Exception as e:
            log_error(f"Failed to send OTP email to {email}: {e}", 500)
            raise InternalServerErrorException("Failed to send OTP email. Please try again later.")
