import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const { testConnection } = useFinance();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      testConnection();
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [testConnection]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-900/90 backdrop-blur-md text-amber-100 text-xs rounded-xl shadow-xl border border-amber-700/60 animate-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> Anda sedang offline. Data tetap tersimpan aman di cache Firestore.
          </span>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-900/90 backdrop-blur-md text-emerald-100 text-xs rounded-xl shadow-xl border border-emerald-700/60 animate-in slide-in-from-bottom-2">
        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Koneksi kembali online. Data tersinkronisasi otomatis dengan Firebase Firestore.</span>
      </div>
    );
  }

  return null;
};
