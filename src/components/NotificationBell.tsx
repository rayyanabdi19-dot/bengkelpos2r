import { useState } from 'react';
import { useBooking, useServis } from '@/hooks/useSupabaseData';
import { formatDate } from '@/lib/format';
import { Bell, CalendarCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

interface NotifItem {
  id: string;
  type: 'booking' | 'transaksi';
  title: string;
  desc: string;
  time: string;
}

export default function NotificationBell() {
  const { bookings } = useBooking();
  const { servisList } = useServis();
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('notif_read');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const notifications: NotifItem[] = [];

  // Booking menunggu
  bookings.filter(b => b.status === 'menunggu').forEach(b => {
    notifications.push({
      id: `booking-${b.id}`,
      type: 'booking',
      title: `Booking baru: ${b.nama}`,
      desc: `${formatDate(b.tanggal)} ${b.jam} • ${b.plat_motor}`,
      time: b.created_at,
    });
  });

  // Transaksi hari ini
  const today = new Date().toISOString().slice(0, 10);
  servisList.filter(s => s.created_at.slice(0, 10) === today).forEach(s => {
    notifications.push({
      id: `servis-${s.id}`,
      type: 'transaksi',
      title: `Transaksi: ${s.nama_pelanggan}`,
      desc: `${s.plat_motor} • ${s.status}`,
      time: s.created_at,
    });
  });

  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    localStorage.setItem('notif_read', JSON.stringify([...allIds]));
  };

  const handleClick = (notif: NotifItem) => {
    const newRead = new Set(readIds);
    newRead.add(notif.id);
    setReadIds(newRead);
    localStorage.setItem('notif_read', JSON.stringify([...newRead]));
    setOpen(false);
    if (notif.type === 'booking') navigate('/booking');
    else navigate('/riwayat');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold">Notifikasi</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Tandai semua dibaca
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Tidak ada notifikasi</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 border-b border-border last:border-0 transition-colors ${!readIds.has(n.id) ? 'bg-primary/5' : ''}`}
              >
                <div className={`shrink-0 mt-0.5 p-1.5 rounded-full ${n.type === 'booking' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}`}>
                  {n.type === 'booking' ? <CalendarCheck className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${!readIds.has(n.id) ? 'font-semibold' : ''}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.desc}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}