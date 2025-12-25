'use client';

import { useEffect } from 'react';

interface StoredTrip {
  id: string;
  riderId: string;
  status: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  serviceType: string;
  fare: number;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverPlate?: string;
  createdAt: string;
}

interface StoredDriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: Date;
}

// Storage keys
const STORAGE_KEYS = {
  ACTIVE_TRIP: 'trippo_active_trip',
  PENDING_TRIP: 'trippo_pending_trip',
  DRIVER_LOCATIONS: 'trippo_driver_locations',
  LAST_KNOWN_LOCATIONS: 'trippo_last_known_locations',
  OFFLINE_TRIPS: 'trippo_offline_trips',
  USER_PREFERENCES: 'trippo_user_preferences',
} as const;

// Check if localStorage is available
const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Generic storage operations
export const storage = {
  // Get item from storage
  get: <T>(key: string, defaultValue: T): T => {
    if (!isStorageAvailable()) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return defaultValue;
    }
  },

  // Set item in storage
  set: <T>(key: string, value: T): boolean => {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      return false;
    }
  },

  // Remove item from storage
  remove: (key: string): boolean => {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      return false;
    }
  },

  // Clear all storage
  clear: (): boolean => {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },
};

// Active trip operations
export const activeTrip = {
  get: (): StoredTrip | null => {
    return storage.get<StoredTrip | null>(STORAGE_KEYS.ACTIVE_TRIP, null);
  },

  set: (trip: StoredTrip): boolean => {
    return storage.set(STORAGE_KEYS.ACTIVE_TRIP, trip);
  },

  update: (updates: Partial<StoredTrip>): boolean => {
    const currentTrip = activeTrip.get();
    if (!currentTrip) {
      return false;
    }
    return storage.set(STORAGE_KEYS.ACTIVE_TRIP, { ...currentTrip, ...updates });
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.ACTIVE_TRIP);
  },
};

// Pending trip operations (for offline use)
export const pendingTrip = {
  get: (): StoredTrip | null => {
    return storage.get<StoredTrip | null>(STORAGE_KEYS.PENDING_TRIP, null);
  },

  set: (trip: StoredTrip): boolean => {
    return storage.set(STORAGE_KEYS.PENDING_TRIP, trip);
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.PENDING_TRIP);
  },
};

// Driver locations cache (for offline use)
export const driverLocations = {
  get: (): Map<string, StoredDriverLocation> => {
    const locations = storage.get<Record<string, StoredDriverLocation>>(STORAGE_KEYS.DRIVER_LOCATIONS, {});
    return new Map(Object.entries(locations));
  },

  set: (driverId: string, location: Omit<StoredDriverLocation, 'driverId'>): boolean => {
    const currentLocations = driverLocations.get();
    const updatedLocations = new Map(currentLocations);
    updatedLocations.set(driverId, { driverId, ...location });
    
    const locationsObj = Object.fromEntries(updatedLocations);
    return storage.set(STORAGE_KEYS.DRIVER_LOCATIONS, locationsObj);
  },

  remove: (driverId: string): boolean => {
    const currentLocations = driverLocations.get();
    const updatedLocations = new Map(currentLocations);
    updatedLocations.delete(driverId);
    
    const locationsObj = Object.fromEntries(updatedLocations);
    return storage.set(STORAGE_KEYS.DRIVER_LOCATIONS, locationsObj);
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.DRIVER_LOCATIONS);
  },
};

// Last known locations (for SOS)
export const lastKnownLocations = {
  get: (): Map<string, { lat: number; lng: number; timestamp: Date }> => {
    const locations = storage.get<Record<string, { lat: number; lng: number; timestamp: Date }>>(
      STORAGE_KEYS.LAST_KNOWN_LOCATIONS,
      {}
    );
    return new Map(Object.entries(locations));
  },

  set: (userId: string, location: { lat: number; lng: number }): boolean => {
    const currentLocations = lastKnownLocations.get();
    const updatedLocations = new Map(currentLocations);
    updatedLocations.set(userId, { ...location, timestamp: new Date() });
    
    const locationsObj = Object.fromEntries(updatedLocations);
    return storage.set(STORAGE_KEYS.LAST_KNOWN_LOCATIONS, locationsObj);
  },

  remove: (userId: string): boolean => {
    const currentLocations = lastKnownLocations.get();
    const updatedLocations = new Map(currentLocations);
    updatedLocations.delete(userId);
    
    const locationsObj = Object.fromEntries(updatedLocations);
    return storage.set(STORAGE_KEYS.LAST_KNOWN_LOCATIONS, locationsObj);
  },
};

// Offline trips queue
export const offlineTrips = {
  get: (): StoredTrip[] => {
    return storage.get<StoredTrip[]>(STORAGE_KEYS.OFFLINE_TRIPS, []);
  },

  add: (trip: StoredTrip): boolean => {
    const currentQueue = offlineTrips.get();
    const updatedQueue = [...currentQueue, trip];
    return storage.set(STORAGE_KEYS.OFFLINE_TRIPS, updatedQueue);
  },

  remove: (tripId: string): boolean => {
    const currentQueue = offlineTrips.get();
    const updatedQueue = currentQueue.filter((trip) => trip.id !== tripId);
    return storage.set(STORAGE_KEYS.OFFLINE_TRIPS, updatedQueue);
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.OFFLINE_TRIPS);
  },
};

// User preferences
export const userPreferences = {
  get: (): Record<string, any> => {
    return storage.get<Record<string, any>>(STORAGE_KEYS.USER_PREFERENCES, {});
  },

  set: (key: string, value: any): boolean => {
    const currentPrefs = userPreferences.get();
    const updatedPrefs = { ...currentPrefs, [key]: value };
    return storage.set(STORAGE_KEYS.USER_PREFERENCES, updatedPrefs);
  },

  remove: (key: string): boolean => {
    const currentPrefs = userPreferences.get();
    delete currentPrefs[key];
    return storage.set(STORAGE_KEYS.USER_PREFERENCES, currentPrefs);
  },
};

// Sync storage when connection restored
export const syncOnReconnect = async (): Promise<boolean> => {
  try {
    const pendingTrip = activeTrip.get();
    if (pendingTrip) {
      console.log('Syncing pending trip to server...');
      // In production, sync with API
      // const response = await fetch('/api/rider/sync-trip', { method: 'POST', body: JSON.stringify(pendingTrip) });
    }

    return true;
  } catch (error) {
    console.error('Error syncing on reconnect:', error);
    return false;
  }
};

// Clean up old data (call periodically)
export const cleanupOldData = (): void => {
  try {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // Clean up old driver locations
    const driverLocs = driverLocations.get();
    driverLocs.forEach((location, driverId) => {
      if (new Date(location.timestamp).getTime() < oneHourAgo) {
        driverLocations.remove(driverId);
      }
    });

    // Clean up old last known locations
    const lastLocs = lastKnownLocations.get();
    lastLocs.forEach((location, userId) => {
      if (new Date(location.timestamp).getTime() < oneHourAgo) {
        lastKnownLocations.remove(userId);
      }
    });

    console.log('Old data cleaned up');
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
};

// Get storage size estimate (in bytes)
export const getStorageSize = (): number => {
  if (!isStorageAvailable()) {
    return 0;
  }

  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      totalSize += localStorage.getItem(key)!.length * 2; // UTF-16 stores as 2 bytes per char
      totalSize += key.length * 2;
    }
  }

  return totalSize;
};

// Check if storage is getting full
export const isStorageFull = (): boolean => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
  const currentSize = getStorageSize();
  return currentSize >= MAX_SIZE;
};

// Handle storage errors
export const handleStorageError = (error: any, fallback?: any): any => {
  console.error('Storage error:', error);

  // Fallback strategies
  if (fallback !== undefined) {
    return fallback;
  }

  // Show user-friendly error
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    alert('Storage is full. Please clear some data or try again later.');
  } else if (error instanceof DOMException) {
    alert('There was a problem saving your data. Please try again.');
  }

  return null;
};

// Hook to use storage with sync
export function useStorage<T>(
  key: string,
  defaultValue: T,
  syncKey?: string
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Load from storage on mount
  useEffect(() => {
    const storedValue = storage.get<T>(key, defaultValue);
    setValue(storedValue);
  }, [key, defaultValue]);

  // Sync with other tabs/windows (using storage event)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          setValue(newValue);
        } catch (error) {
          console.error('Error parsing stored value:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [value, (newValue: T) => {
    setValue(newValue);
    storage.set(key, newValue);
    
    // Trigger storage event for other tabs/windows
    if (syncKey) {
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(newValue),
        storageArea: localStorage,
        url: window.location.href,
      }));
    }
  }];
}
