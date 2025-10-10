// src/components/NotificationManager.tsx
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useCodesStore } from '../store/codeStore';

const REFRESH_TOAST_ID = 'refresh-toast';

/**
 * A non-rendering component that handles all app notifications.
 */
export function NotificationManager() {
  const { newCodes, error, clearNewCodes } = useCodesStore();
  const [isFocused, setIsFocused] = useState(true);
  const [backgroundRefreshCount, setBackgroundRefreshCount] = useState(0);
  const toastId = useRef<string | number | null>(null);

  // Effect to check for window focus state
  useEffect(() => {
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Effect to handle new codes and errors from the store
  useEffect(() => {
    if (newCodes.length > 0) {
      if (isFocused) {
        if (toast.isActive(REFRESH_TOAST_ID) && toastId.current) {
          toast.update(toastId.current, { render: '¡Nuevos códigos encontrados!', type: 'success', autoClose: 3000 });
        } else {
          toastId.current = toast.success('¡Nuevos códigos encontrados!', { toastId: REFRESH_TOAST_ID });
        }
      } else {
        setBackgroundRefreshCount(count => count + 1);
      }

      // System Notification for new codes
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const body = newCodes
          .map(({ game, codes }) => `${game}: ${codes.slice(0, 4).join(', ')}${codes.length > 4 ? '…' : ''}`)
          .join('\n');
        new Notification('Nuevos códigos activos', { body });
      }
      clearNewCodes(); // Reset new codes in store after handling
    }

    // Toast for any errors during fetch
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [newCodes, error, isFocused, clearNewCodes]);

  // Effect to show an accumulated toast when window regains focus
  useEffect(() => {
    if (isFocused && backgroundRefreshCount > 0) {
      const message = `Nuevos códigos encontrados (x${backgroundRefreshCount})`;
      if (toast.isActive(REFRESH_TOAST_ID) && toastId.current) {
        toast.update(toastId.current, { render: message, type: 'info' });
      } else {
        toastId.current = toast.info(message, { toastId: REFRESH_TOAST_ID });
      }
      setBackgroundRefreshCount(0);
    }
  }, [isFocused, backgroundRefreshCount]);

  // Request system notification permission on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);
  
  return null; // This component does not render any UI
}
