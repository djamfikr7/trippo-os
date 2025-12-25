'use client';

import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

// API base URL (using XTransformPort for Caddy gateway)
const API_BASE = '/api';

// Types
interface Driver {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: {
    model: string;
    color: string;
    type: string;
    plate: string;
  };
  isOnline: boolean;
  isVerified: boolean;
  rating: number;
  totalTrips: number;
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
  tier: string;
  meritScore: number;
}

interface Trip {
  id: string;
  riderId: string;
  driverId: string | null;
  status: string;
  serviceType: string;
  isShared: boolean;
  isScheduled: boolean;
  scheduledFor: Date | null;
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
  distance: {
    meters: number;
    km: number;
  };
  duration: {
    seconds: number;
    minutes: number;
  };
  pricing: {
    baseFare: number;
    surgeMultiplier: number;
    surgeFare: number;
    estimatedFare: number;
    demandLevel: string;
    surgeZone?: string;
  };
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicle: any;
    rating: number;
    photo: string | null;
    estimatedArrival: number;
  };
  rider?: {
    id: string;
    name: string;
    phone: string;
  };
}

interface SurgeZone {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  radiusMeters: number;
  demand: number;
  surgeMultiplier: number;
  avgWaitTime: number;
  activeDrivers: number;
  isActive: boolean;
  updatedAt: string;
}

interface FareEstimate {
  serviceType: string;
  pickup: {
    lat: number;
    lng: number;
  };
  dropoff: {
    lat: number;
    lng: number;
  };
  distance: {
    meters: number;
    km: number;
  };
  duration: {
    seconds: number;
    minutes: number;
  };
  pricing: {
    baseFare: number;
    surgeMultiplier: number;
    surgeFare: number;
    estimatedFare: number;
    demandLevel: string;
    surgeZone?: string;
  };
}

interface AddressSuggestion {
  displayName: string;
  lat: number;
  lon: number;
  address: {
    road: string;
    house_number: string;
    city: string;
    county: string;
    state: string;
    postcode: string;
    country: string;
  };
}

// API response types
interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Fetch drivers
export const useDrivers = (params?: {
  status?: string;
  vehicleType?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.vehicleType) queryParams.append('vehicleType', params.vehicleType);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  return useQuery({
    queryKey: ['drivers', params],
    queryFn: async (): Promise<Driver[]> => {
      const response = await fetch(`${API_BASE}/admin/drivers?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      const data: { drivers: Driver[] } = await response.json();
      return data.drivers;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 15000, // Refresh every 15 seconds
  });
};

// Fetch single driver
export const useDriver = (driverId: string | null) => {
  return useQuery({
    queryKey: ['driver', driverId],
    queryFn: async (): Promise<Driver | null> => {
      if (!driverId) return null;
      const response = await fetch(`${API_BASE}/admin/drivers/${driverId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch driver');
      }
      const data: { driver: Driver } = await response.json();
      return data.driver;
    },
    enabled: !!driverId,
  });
};

// Update driver
export const useUpdateDriver = (): UseMutationResult<
  { driverId: string; data: any },
  Error,
  { driver: Driver }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, data }) => {
      const response = await fetch(`${API_BASE}/admin/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update driver');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.driverId] });
    },
  });
};

// Fetch trips
export const useTrips = (params?: {
  status?: string;
  payment?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.payment) queryParams.append('payment', params.payment);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  return useQuery({
    queryKey: ['trips', params],
    queryFn: async (): Promise<PaginatedResponse<Trip>> => {
      const response = await fetch(`${API_BASE}/admin/trips?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      return {
        items: data.trips,
        total: data.total,
        limit: data.limit,
        offset: data.offset,
      };
    },
    staleTime: 20000, // 20 seconds
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};

// Fetch single trip
export const useTrip = (tripId: string | null) => {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async (): Promise<Trip | null> => {
      if (!tripId) return null;
      const response = await fetch(`${API_BASE}/admin/trips/${tripId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trip');
      }
      const data: { trip: Trip } = await response.json();
      return data.trip;
    },
    enabled: !!tripId,
    refetchInterval: (data) => {
      // Refetch more frequently for active trips
      const trip = data as Trip;
      if (trip && ['SEARCHING', 'DRIVER_FOUND', 'IN_PROGRESS', 'ARRIVED'].includes(trip.status)) {
        return 5000; // Every 5 seconds
      }
      return false;
    },
  });
};

// Fetch surge zones
export const useSurgeZones = () => {
  return useQuery({
    queryKey: ['surge-zones'],
    queryFn: async (): Promise<SurgeZone[]> => {
      const response = await fetch(`${API_BASE}/surge/estimate`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch surge zones');
      }
      const data = await response.json();
      return data.surgeZones;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

// Estimate fare
export const useFareEstimate = () => {
  return useMutation({
    mutationFn: async (params: {
      serviceType: string;
      pickupLat: number;
      pickupLng: number;
      dropoffLat: number;
      dropoffLng: number;
    }): Promise<FareEstimate> => {
      const response = await fetch(`${API_BASE}/surge/estimate?serviceType=${params.serviceType}&pickupLat=${params.pickupLat}&pickupLng=${params.pickupLng}&dropoffLat=${params.dropoffLat}&dropoffLng=${params.dropoffLng}`);
      
      if (!response.ok) {
        throw new Error('Failed to get fare estimate');
      }
      
      return await response.json();
    },
  });
};

// Request trip
export const useRequestTrip = (): UseMutationResult<
  Trip,
  Error,
  {
    serviceType: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
    paymentMethod: string;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params) => {
      const response = await fetch(`${API_BASE}/rider/request-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to request trip');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate trips query
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      // Invalidate user's active trips
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
    },
  });
};

// Cancel trip
export const useCancelTrip = (): UseMutationResult<
  { success: boolean },
  Error,
  {
    tripId: string;
    userId: string;
    reason?: string;
  }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, userId, reason }) => {
      const response = await fetch(`${API_BASE}/rider/cancel-trip/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel trip');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Invalidate trip queries
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', data?.success ? 'any' : 'any'] });
      queryClient.invalidateQueries({ queryKey: ['active-trips'] });
    },
  });
};

// Fetch dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Address autocomplete
export const useAddressAutocomplete = (query: string, debounceMs = 300) => {
  return useQuery({
    queryKey: ['address-autocomplete', query],
    queryFn: async (): Promise<AddressSuggestion[]> => {
      if (!query || query.length < 2) return [];

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
        if (!response.ok) {
          throw new Error('Failed to fetch addresses');
        }
        const data = await response.json();
        
        return data.map((item: any) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: item.address || {},
        }));
      } catch (error) {
        console.error('Address autocomplete error:', error);
        return [];
      }
    },
    enabled: query.length >= 2,
    staleTime: 60000, // 1 minute
  });
};

// Fraud alerts
export const useFraudAlerts = (params?: {
  severity?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  return useQuery({
    queryKey: ['fraud-alerts', params],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/admin/fraud?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch fraud alerts');
      }
      return await response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

// Update fraud report
export const useUpdateFraudReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status, action }: any) => {
      const response = await fetch(`${API_BASE}/admin/fraud`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update fraud report');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
    },
  });
};

// Run fraud detection
export const useRunFraudDetection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_BASE}/admin/fraud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RUN_DETECTION' }),
      });

      if (!response.ok) {
        throw new Error('Failed to run fraud detection');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};
