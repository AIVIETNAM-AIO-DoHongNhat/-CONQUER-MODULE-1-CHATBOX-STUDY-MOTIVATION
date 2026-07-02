import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BoWidget from "@/components/BoWidget";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f6f1]">
      <Header />
      {/* Outlet: nội dung từng route render ở đây (full-width; trang tự đặt container) */}
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Nút nổi trò chuyện với Bo - hiện trên mọi trang */}
      <BoWidget />
    </div>
  );
}
