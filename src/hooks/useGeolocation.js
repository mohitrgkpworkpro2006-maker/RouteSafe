import { useCallback, useEffect, useState } from 'react';

// status: loading | success | denied | unavailable | error | unsupported
export default function useGeolocation(enabled = true) {
  const [state, setState] = useState({ status: 'loading', position: null });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) return setState({ status: 'unsupported', position: null });
    setState({ status: 'loading', position: null });
    navigator.geolocation.getCurrentPosition(
      (p) => setState({ status: 'success', position: [p.coords.latitude, p.coords.longitude] }), // [lat, lng]
      (e) => setState({ status: e.code === 1 ? 'denied' : e.code === 2 ? 'unavailable' : 'error', position: null }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => { if (enabled) request(); else setState({ status: 'idle', position: null }); }, [enabled, request]);
  return { ...state, retry: request };
}
