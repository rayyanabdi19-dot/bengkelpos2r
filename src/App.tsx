import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useStockNotification } from "@/hooks/useStockNotification";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TransaksiPage from "@/pages/TransaksiPage";
import ScanPage from "@/pages/ScanPage";
import SparepartPage from "@/pages/SparepartPage";
import PembelianPage from "@/pages/PembelianPage";
import LayananPage from "@/pages/LayananPage";
import BookingPage from "@/pages/BookingPage";
import PelangganPage from "@/pages/PelangganPage";
import LaporanPage from "@/pages/LaporanPage";
import LabaPage from "@/pages/LabaPage";
import PengaturanPage from "@/pages/PengaturanPage";
import ProfilePage from "@/pages/ProfilePage";
import PrinterPage from "@/pages/PrinterPage";
import RiwayatPage from "@/pages/RiwayatPage";
import InstallPage from "@/pages/InstallPage";
import KaryawanPage from "@/pages/KaryawanPage";
import GajiPage from "@/pages/GajiPage";
import AbsensiPage from "@/pages/AbsensiPage";
import BackupPage from "@/pages/BackupPage";
import PanduanPage from "@/pages/PanduanPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();
  useStockNotification();

  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transaksi" element={<TransaksiPage />} />
        <Route path="/riwayat" element={<RiwayatPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/sparepart" element={<SparepartPage />} />
        <Route path="/pembelian" element={<PembelianPage />} />
        <Route path="/layanan" element={<LayananPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/pelanggan" element={<PelangganPage />} />
        <Route path="/laporan" element={<LaporanPage />} />
        <Route path="/laporan/laba" element={<LabaPage />} />
        <Route path="/pengaturan" element={<PengaturanPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/printer" element={<PrinterPage />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/karyawan" element={<KaryawanPage />} />
        <Route path="/karyawan/gaji" element={<GajiPage />} />
        <Route path="/karyawan/absensi" element={<AbsensiPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
