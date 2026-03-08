import { useEffect, useCallback } from 'react';
import { useSparepart } from '@/hooks/useSupabaseData';

export function useStockNotification() {
  const { spareparts, loading } = useSparepart();

  const checkAndNotify = useCallback(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const lowStock = spareparts.filter(sp => sp.stok <= sp.stok_minimum && sp.stok_minimum > 0);
    
    if (lowStock.length > 0) {
      const names = lowStock.slice(0, 3).map(sp => sp.nama).join(', ');
      const extra = lowStock.length > 3 ? ` dan ${lowStock.length - 3} lainnya` : '';
      
      new Notification('⚠️ Stok Menipis!', {
        body: `${names}${extra} membutuhkan restock.`,
        icon: '/pwa-icon-192.png',
        tag: 'low-stock', // prevents duplicate notifications
      });
    }
  }, [spareparts]);

  useEffect(() => {
    if (!loading && spareparts.length > 0) {
      // Check on initial load with a small delay
      const timeout = setTimeout(checkAndNotify, 3000);
      return () => clearTimeout(timeout);
    }
  }, [loading, spareparts, checkAndNotify]);
}
