from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from authentication.models import PendingRegistration


class Command(BaseCommand):
    help = (
        "Xoá các PendingRegistration bị kẹt (đăng ký dở chưa verify). "
        "Mặc định chỉ LIỆT KÊ; phải kèm --email/--expired/--all để thực sự xoá."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            help="Chỉ xoá pending registration có email này.",
        )
        parser.add_argument(
            "--expired",
            action="store_true",
            help="Chỉ xoá những bản ghi đã hết hạn OTP (verification_token_expires_at < bây giờ).",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Xoá TẤT CẢ pending registrations.",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Bỏ qua bước xác nhận, xoá luôn.",
        )

    def handle(self, *args, **options):
        email = options.get("email")
        expired = options.get("expired")
        delete_all = options.get("all")
        skip_confirm = options.get("yes")

        # Mặc định (không cờ nào): liệt kê toàn bộ để xem trước.
        list_only = not (email or expired or delete_all)

        qs = PendingRegistration.objects.all()
        if email:
            qs = qs.filter(email=email)
        elif expired:
            qs = qs.filter(verification_token_expires_at__lt=timezone.now())

        count = qs.count()

        if count == 0:
            self.stdout.write(self.style.WARNING("Không có PendingRegistration nào khớp."))
            return

        # In danh sách khớp.
        self.stdout.write(f"Tìm thấy {count} pending registration:")
        for pr in qs.order_by("-created_at"):
            status = (
                "ĐÃ HẾT HẠN"
                if pr.verification_token_expires_at < timezone.now()
                else "còn hạn"
            )
            self.stdout.write(
                f"  - {pr.email} | {pr.full_name} | tạo lúc {pr.created_at} | OTP {status}"
            )

        if list_only:
            self.stdout.write(
                self.style.NOTICE(
                    "\nĐây chỉ là liệt kê. Dùng --email <email>, --expired, hoặc --all để xoá."
                )
            )
            return

        if not skip_confirm:
            confirm = input(f"\nXác nhận xoá {count} bản ghi trên? [y/N]: ").strip().lower()
            if confirm not in ("y", "yes"):
                raise CommandError("Đã huỷ, không xoá gì cả.")

        deleted, _ = qs.delete()
        self.stdout.write(
            self.style.SUCCESS(f"Đã xoá {count} pending registration ({deleted} dòng DB).")
        )
