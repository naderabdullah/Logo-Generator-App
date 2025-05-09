'use client';

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Function to update online status
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    // Initial check
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="offline-indicator">
      You are currently offline. Some features may be limited.
    </div>
  );
}