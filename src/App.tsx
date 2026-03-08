import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import TransaksiPage from "@/pages/TransaksiPage";
import ScanPage from "@/pages/ScanPage";
import SparepartPage from "@/pages/SparepartPage";
import BookingPage from "@/pages/BookingPage";
import PelangganPage from "@/pages/PelangganPage";
import LaporanPage from "@/pages/LaporanPage";
import LabaPage from "@/pages/LabaPage";
import PengaturanPage from "@/pages/PengaturanPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  if (!user) return <LoginPage />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transaksi" element={<TransaksiPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/sparepart" element={<SparepartPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/pelanggan" element={<PelangganPage />} />
        <Route path="/laporan" element={<LaporanPage />} />
        <Route path="/pengaturan" element={<PengaturanPage />} />
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
