import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-sm z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline Mode — Live updates will reconnect automatically. Games remain fully playable!</span>
    </div>
  );
};
