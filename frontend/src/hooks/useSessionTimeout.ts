import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useToastStore } from '../store/toastStore';
import { useNavigate } from 'react-router-dom';

export function useSessionTimeout() {
  const { isAuthenticated, logout } = useAuthStore();
  const { timeoutMinutes, lastActivityTime, recordActivity } = useSessionStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const lastThrottleRef = useRef<number>(Date.now());

  // Throttled activity tracker (at most once every 5 seconds)
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current > 5000) {
      lastThrottleRef.current = now;
      recordActivity();
      if (showWarning) {
        setShowWarning(false);
      }
    }
  }, [recordActivity, showWarning]);

  // Attach global event listeners for active user interaction
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [isAuthenticated, handleUserActivity]);

  // Periodic inactivity check
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastActivityTime;
      const totalAllowedMs = timeoutMinutes * 60 * 1000;
      const warningThresholdMs = 60 * 1000; // 60-second advance notice
      const msUntilTimeout = totalAllowedMs - elapsedMs;

      if (msUntilTimeout <= 0) {
        // Timeout expired: perform auto-logout
        setShowWarning(false);
        logout();
        addToast({
          type: 'warning',
          title: 'Session Expired',
          message: `You were automatically signed out after ${timeoutMinutes} minutes of inactivity for security.`,
        });
        navigate('/login');
      } else if (msUntilTimeout <= warningThresholdMs) {
        // Within 60 seconds warning window
        setShowWarning(true);
        setSecondsRemaining(Math.max(1, Math.ceil(msUntilTimeout / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, timeoutMinutes, lastActivityTime, logout, addToast, navigate]);

  const staySignedIn = useCallback(() => {
    recordActivity();
    setShowWarning(false);
    lastThrottleRef.current = Date.now();
  }, [recordActivity]);

  const logoutNow = useCallback(async () => {
    setShowWarning(false);
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    showWarning,
    secondsRemaining,
    staySignedIn,
    logoutNow,
  };
}
