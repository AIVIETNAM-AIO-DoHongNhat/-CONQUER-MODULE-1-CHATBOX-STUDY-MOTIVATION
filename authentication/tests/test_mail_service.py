"""Tests for MailService."""

from unittest.mock import patch

from django.core import mail

from authentication.services.mail_service import MailService
from authentication.tests.base import AuthenticationTestCase
from core.exceptions import InternalServerErrorException


class MailServiceTests(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.mail_service = MailService()

    def test_send_recovery_email_success(self):
        """Recovery email is sent successfully."""
        self.mail_service.send_otp_email(
            "recover@example.com",
            "123456",
            10,
            subject="Reset your password",
            email_heading="Reset your password",
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["recover@example.com"])
        self.assertIn("Reset your password", mail.outbox[0].subject)

    def test_send_otp_email_success(self):
        """OTP email is sent successfully."""
        self.mail_service.send_otp_email("otp@example.com", "123456", 10)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["otp@example.com"])
        self.assertIn("Verify Your Account", mail.outbox[0].subject)

    @patch("authentication.services.mail_service.EmailMultiAlternatives.send")
    def test_send_recovery_email_raises_on_failure(self, mock_send):
        """InternalServerErrorException raised when recovery email fails."""
        mock_send.side_effect = Exception("SMTP error")
        with self.assertRaises(InternalServerErrorException):
            self.mail_service.send_otp_email(
                "recover@example.com",
                "123456",
                10,
                subject="Reset your password",
                email_heading="Reset your password",
            )

    @patch("authentication.services.mail_service.EmailMultiAlternatives.send")
    def test_send_otp_email_raises_on_failure(self, mock_send):
        """InternalServerErrorException raised when OTP email fails."""
        mock_send.side_effect = Exception("SMTP error")
        with self.assertRaises(InternalServerErrorException):
            self.mail_service.send_otp_email("otp@example.com", "123456", 10)
