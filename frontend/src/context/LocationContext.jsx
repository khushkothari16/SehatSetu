import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => locationService.getCachedLocation());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize and auto-detect location on initial app load
  useEffect(() => {
    let isMounted = true;

    const initLocation = async () => {
      setLoading(true);
      try {
        const freshLoc = await locationService.getCurrentLocation();
        if (isMounted && freshLoc) {
          setLocation(freshLoc);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initLocation();

    // Start continuous live tracking for device position changes
    const watchId = locationService.watchLiveLocation((updatedLoc) => {
      if (isMounted && updatedLoc) {
        setLocation(updatedLoc);
      }
    });

    // Listen for broadcast location updates from anywhere in the app
    const handleLocationChange = (e) => {
      if (isMounted && e.detail) {
        setLocation(e.detail);
      }
    };
    window.addEventListener('location_state_change', handleLocationChange);

    return () => {
      isMounted = false;
      locationService.clearWatch(watchId);
      window.removeEventListener('location_state_change', handleLocationChange);
    };
  }, []);

  const refreshLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const freshLoc = await locationService.getCurrentLocation();
      if (freshLoc) {
        setLocation(freshLoc);
        return freshLoc;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setManualLocation = useCallback(async (villageName, district, state) => {
    setLoading(true);
    try {
      const manualLoc = await locationService.setManualLocation(villageName, district, state);
      if (manualLoc) {
        setLocation(manualLoc);
        return manualLoc;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        refreshLocation,
        setManualLocation,
        isLive: !!location?.isLive,
        isGps: !!location?.isGps,
        isManual: !!location?.isManual,
        coordinates: { lat: location?.lat || 28.1289, lng: location?.lng || 75.3995 },
        fullAddress: location?.fullAddress || `${location?.village || 'Location'}, India`
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
