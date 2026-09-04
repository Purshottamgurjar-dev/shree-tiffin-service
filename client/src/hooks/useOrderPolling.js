import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for periodic order state refresh with leak-free lifecycle cleanup
 * Automatically stops polling when order reaches terminal state (Delivered / Cancelled)
 * 
 * @param {Function} pollFn - Async fetch callback
 * @param {boolean} shouldPoll - Whether current status requires polling
 * @param {number} intervalMs - Polling cadence in ms (default 10000)
 */
export default function useOrderPolling(pollFn, shouldPoll = false, intervalMs = 10000) {
  const [isPolling, setIsPolling] = useState(false);
  const timerRef = useRef(null);
  const pollFnRef = useRef(pollFn);

  // Keep latest callback reference without triggering timer re-creation
  useEffect(() => {
    pollFnRef.current = pollFn;
  }, [pollFn]);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!shouldPoll) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    timerRef.current = setInterval(() => {
      if (typeof pollFnRef.current === 'function') {
        pollFnRef.current();
      }
    }, intervalMs);

    // Cleanup interval on unmount or when shouldPoll toggles to false
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPolling(false);
    };
  }, [shouldPoll, intervalMs]);

  return { isPolling };
}
