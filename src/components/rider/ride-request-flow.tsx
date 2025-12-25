'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  Car,
  Shield,
  AlertTriangle,
  Search,
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Phone,
  Star,
  AlertCircle as AlertCircleIcon,
} from 'lucide-react';
import { useFareEstimate, useRequestTrip } from '@/lib/api';
import { useAddressAutocomplete } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LocationState = 'searching' | 'selecting' | 'confirmed';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface SelectedLocations {
  pickup: Location | null;
  dropoff: Location | null;
}

interface AddressSuggestion {
  displayName: string;
  lat: number;
  lon: number;
  address: any;
}

export function RideRequestFlow() {
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocations>({
    pickup: null,
    dropoff: null,
  });
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff' | null>(null);
  const [serviceType, setServiceType] = useState('STANDARD_RIDE');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<{ pickup: number; dropoff: number }>({
    pickup: -1,
    dropoff: -1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'select-locations' | 'confirm-details' | 'searching-driver'>('select-locations');
  const [retryCount, setRetryCount] = useState(0);
  const [showSOS, setShowSOS] = useState(false);

  // Address autocomplete for pickup
  const { data: pickupSuggestions = [], isLoading: isPickupLoading } = useAddressAutocomplete(pickupSearch);

  // Address autocomplete for dropoff
  const { data: dropoffSuggestions = [], isLoading: isDropoffLoading } = useAddressAutocomplete(dropoffSearch);

  // Fare estimation mutation
  const fareMutation = useFareEstimate();

  // Trip request mutation
  const requestTripMutation = useRequestTrip();

  // Get fare estimate when locations change
  const updateFareEstimate = async () => {
    if (selectedLocations.pickup && selectedLocations.dropoff) {
      setError(null);
      try {
        const estimate = await fareMutation.mutateAsync({
          serviceType,
          pickupLat: selectedLocations.pickup.lat,
          pickupLng: selectedLocations.pickup.lng,
          dropoffLat: selectedLocations.dropoff.lat,
          dropoffLng: selectedLocations.dropoff.lng,
        });

        if (estimate) {
          setFareEstimate(estimate.pricing);
          console.log('Fare estimate:', estimate.pricing);
        }
      } catch (err: any) {
        setError('Failed to get fare estimate. Please try again.');
        console.error('Fare estimate error:', err);
      }
    }
  };

  // Handle address selection
  const handleAddressSelect = (type: 'pickup' | 'dropoff', index: number, location: any) => {
    const selectedLocation: Location = {
      lat: location.lat,
      lng: location.lon,
      address: location.displayName || location.address?.road || 'Selected location',
    };

    setSelectedLocations((prev) => ({
      ...prev,
      [type]: selectedLocation,
    }));

    setSelectedAddressIndex((prev) => ({
      ...prev,
      [type]: index,
    }));

    // Clear search
    if (type === 'pickup') {
      setPickupSearch(location.displayName || location.address?.road || '');
    } else {
      setDropoffSearch(location.displayName || location.address?.road || '');
    }
  };

  // Handle pickup on map click
  const handleMapClick = (type: 'pickup' | 'dropoff', lat: number, lng: number) => {
    const location: Location = {
      lat,
      lng,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    };

    setSelectedLocations((prev) => ({
      ...prev,
      [type]: location,
    }));

    // Clear address selection
    if (type === 'pickup') {
      setSelectedAddressIndex((prev) => ({ ...prev, pickup: -1 }));
    } else {
      setSelectedAddressIndex((prev) => ({ ...prev, dropoff: -1 }));
    }
  };

  // Swap pickup and dropoff
  const handleSwapLocations = () => {
    setSelectedLocations((prev) => ({
      pickup: prev.dropoff,
      dropoff: prev.pickup,
    }));
    setPickupSearch(dropoffSearch);
    setDropoffSearch(pickupSearch);
    setSelectedAddressIndex({ pickup: selectedAddressIndex.dropoff, dropoff: selectedAddressIndex.pickup });
  };

  // Request trip with error handling
  const handleRequestTrip = async () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);

    const attemptRequest = async (attempt: number) => {
      try {
        if (!selectedLocations.pickup || !selectedLocations.dropoff) {
          throw new Error('Please select pickup and dropoff locations');
        }

        console.log(`Requesting trip (attempt ${attempt + 1})...`);

        const result = await requestTripMutation.mutateAsync({
          serviceType,
          pickupLat: selectedLocations.pickup.lat,
          pickupLng: selectedLocations.pickup.lng,
          pickupAddress: selectedLocations.pickup.address,
          dropoffLat: selectedLocations.dropoff.lat,
          dropoffLng: selectedLocations.dropoff.lng,
          dropoffAddress: selectedLocations.dropoff.address,
          paymentMethod: 'CASH',
        });

        if (result.trip) {
          console.log('Trip request successful:', result.trip);
          setCurrentStep('searching-driver');
          setIsLoading(false);
        } else {
          throw new Error('No trip returned from server');
        }
      } catch (err: any) {
        console.error('Request trip error:', err);

        // Error handling with fallbacks
        if (attempt < 2) {
          // Retry logic
          setRetryCount(attempt + 1);
          setTimeout(() => attemptRequest(attempt + 1), 2000 * (attempt + 1));
          setError(`Connection issue. Retrying... (${attempt + 1}/3)`);
        } else {
          // Max retries reached
          const errorMessage = err.message || 'Failed to request trip. Please try again.';
          
          // Provide actionable feedback
          if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            setError('Network error. Please check your connection and try again.');
          } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
            setError('Server error. Our team has been notified. Please try again in a few minutes.');
          } else {
            setError(errorMessage);
          }

          setIsLoading(false);
          
          // Show SOS option after failed attempts
          if (attempt >= 2) {
            setShowSOS(true);
          }
        }
      }
    };

    await attemptRequest(0);
  };

  // Can proceed check
  const canProceed = selectedLocations.pickup && selectedLocations.dropoff && fareEstimate;

  return (
    <div className="space-y-6">
      {/* Error Alert with action */}
      {error && (
        <Alert variant="destructive" className="animate-in slide-in-from-top-2">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* SOS Emergency Button (Always visible) */}
      <Alert className="border-red-500/50 bg-red-500/5">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-500">Emergency SOS</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm text-red-500">
            Tap here if you're in immediate danger or need urgent help
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => console.log('SOS triggered')}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Trigger SOS
          </Button>
        </AlertDescription>
      </Alert>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Request a Ride</h2>
          <p className="text-sm text-muted-foreground">
            Select your pickup and dropoff locations
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Step {currentStep === 'select-locations' ? '1 of 3' : currentStep === 'confirm-details' ? '2 of 3' : '3 of 3'}
        </Badge>
      </div>

      {/* Step 1: Select Locations */}
      {currentStep === 'select-locations' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Location Inputs */}
          <div className="space-y-4">
            {/* Pickup Input */}
            <Card className="bg-card border border-border/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Pickup Location
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enter address or click on map
                    </CardDescription>
                  </div>
                </div>
                {selectedLocations.pickup && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLocations((prev) => ({ ...prev, pickup: null }));
                      setSelectedAddressIndex((prev) => ({ ...prev, pickup: -1 }));
                      setPickupSearch('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter pickup address..."
                    value={pickupSearch}
                    onChange={(e) => setPickupSearch(e.target.value)}
                    onFocus={() => setActiveInput('pickup')}
                    className="pl-9 bg-background"
                  />
                  {/* Autocomplete Dropdown */}
                  {activeInput === 'pickup' && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border/20 bg-card shadow-lg">
                      {pickupSuggestions.map((addr: any, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddressSelect('pickup', index, addr)}
                          className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                            selectedAddressIndex.pickup === index ? 'bg-muted/80' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{addr.displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.address?.road}, {addr.address?.city}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedLocations.pickup && (
                  <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{selectedLocations.pickup.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      <span>{selectedLocations.pickup.lat.toFixed(4)}, {selectedLocations.pickup.lng.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dropoff Input */}
            <Card className="bg-card border border-border/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <Navigation className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Dropoff Location
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enter your destination
                    </CardDescription>
                  </div>
                </div>
                {selectedLocations.dropoff && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLocations((prev) => ({ ...prev, dropoff: null }));
                      setSelectedAddressIndex((prev) => ({ ...prev, dropoff: -1 }));
                      setDropoffSearch('');
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Enter destination..."
                    value={dropoffSearch}
                    onChange={(e) => setDropoffSearch(e.target.value)}
                    onFocus={() => setActiveInput('dropoff')}
                    className="pl-9 bg-background"
                  />
                  {/* Autocomplete Dropdown */}
                  {activeInput === 'dropoff' && dropoffSuggestions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border/20 bg-card shadow-lg">
                      {dropoffSuggestions.map((addr: any, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddressSelect('dropoff', index, addr)}
                          className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                            selectedAddressIndex.dropoff === index ? 'bg-muted/80' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Navigation className="h-4 w-4 text-amber-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{addr.displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.address?.road}, {addr.address?.city}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedLocations.dropoff && (
                  <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{selectedLocations.dropoff.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      <span>{selectedLocations.dropoff.lat.toFixed(4)}, {selectedLocations.dropoff.lng.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Swap Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleSwapLocations}
              className="w-full h-auto py-6 border-2 border-dashed"
            >
              <ArrowDown className="mr-2 h-5 w-5" />
              <ArrowUp className="mr-2 h-5 w-5" />
              Swap Locations
            </Button>

            {/* Service Type Selection */}
            <Card className="bg-card border border-border/20">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Service Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
                  <SelectTrigger className="w-full bg-background">
                    <Car className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD_RIDE">Standard Ride</SelectItem>
                    <SelectItem value="PREMIUM_RIDE">Premium Ride</SelectItem>
                    <SelectItem value="BIKE">Bike</SelectItem>
                    <SelectItem value="CARGO">Cargo</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card className="bg-card border border-border/20 lg:row-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Select on Map
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <MapContainer
                center={[40.7128, -74.0060]}
                zoom={13}
                style={{ height: '500px', width: '100%' }}
                className="rounded-lg"
                onclick={(e: any) => {
                  const map = e.target as any;
                  if (map && map._map) {
                    const { lat, lng } = map._map.mouseEventToLatLng(e.originalEvent);
                    // Set as pickup or dropoff based on what's selected
                    if (!selectedLocations.pickup) {
                      handleMapClick('pickup', lat, lng);
                    } else if (!selectedLocations.dropoff) {
                      handleMapClick('dropoff', lat, lng);
                    }
                  }
                }}
              >
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Pickup Marker */}
                {selectedLocations.pickup && (
                  <CircleMarker
                    center={[selectedLocations.pickup.lat, selectedLocations.pickup.lng]}
                    radius={150}
                    fillColor="#22c55e"
                    color="transparent"
                    fillOpacity={0.2}
                  >
                    <Marker
                      position={[selectedLocations.pickup.lat, selectedLocations.pickup.lng]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #22c55e; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8s12 8 12 8v0c0-6-8-12-8s12-8 12-8z"/></svg>
                        </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                      })}
                    >
                      <Popup>
                        <div className="space-y-1 min-w-[200px]">
                          <p className="text-sm font-semibold text-foreground">Pickup</p>
                          <p className="text-xs text-muted-foreground">{selectedLocations.pickup.address}</p>
                          <p className="text-xs text-muted-foreground">{selectedLocations.pickup.lat.toFixed(4)}, {selectedLocations.pickup.lng.toFixed(4)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </CircleMarker>
                )}

                {/* Dropoff Marker */}
                {selectedLocations.dropoff && (
                  <CircleMarker
                    center={[selectedLocations.dropoff.lat, selectedLocations.dropoff.lng]}
                    radius={150}
                    fillColor="#f59e0b"
                    color="transparent"
                    fillOpacity={0.2}
                  >
                    <Marker
                      position={[selectedLocations.dropoff.lat, selectedLocations.dropoff.lng]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background: #f59e0b; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8s12 8 12 8v0c0-6-8-12-8s12-8 12 8z"/></svg>
                        </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                      })}
                    >
                      <Popup>
                        <div className="space-y-1 min-w-[200px]">
                          <p className="text-sm font-semibold text-foreground">Dropoff</p>
                          <p className="text-xs text-muted-foreground">{selectedLocations.dropoff.address}</p>
                          <p className="text-xs text-muted-foreground">{selectedLocations.dropoff.lat.toFixed(4)}, {selectedLocations.dropoff.lng.toFixed(4)}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </CircleMarker>
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Confirm Details */}
      {currentStep === 'confirm-details' && fareEstimate && selectedLocations.pickup && selectedLocations.dropoff && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Trip Summary */}
          <div className="space-y-4">
            <Card className="bg-card border border-border/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Trip Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Pickup</p>
                      <p className="text-sm text-muted-foreground">{selectedLocations.pickup.address}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                      <Navigation className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Dropoff</p>
                      <p className="text-sm text-muted-foreground">{selectedLocations.dropoff.address}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Distance & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Distance</p>
                    <p className="text-lg font-semibold text-foreground">
                      {fareEstimate.distance?.km || 'N/A'} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-foreground" />
                      <p className="text-lg font-semibold text-foreground">
                        {fareEstimate.duration?.minutes || 'N/A'} min
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Service Type */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Service Type</p>
                  <Badge variant="outline">{serviceType.replace('_', ' ')}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Info */}
          <Card className="bg-card border border-border/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Base Fare */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Base Fare</span>
                <span className="text-sm font-semibold text-foreground">
                  ${fareEstimate.baseFare?.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* Surge */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">Surge</span>
                  {fareEstimate.surgeMultiplier > 1 && (
                    <Badge className="bg-amber-500/10 text-amber-500 text-xs">
                      {fareEstimate.surgeMultiplier}x
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-foreground">
                  +${(fareEstimate.surgeFare - fareEstimate.baseFare)?.toFixed(2) || '0.00'}
                </span>
              </div>

              <Separator />

              {/* Total Fare */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold text-foreground">Total (Cash)</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  ${fareEstimate.estimatedFare?.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* Demand Level */}
              {fareEstimate.demandLevel && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Current Demand</p>
                  <Badge
                    variant={
                      fareEstimate.demandLevel === 'CRITICAL' ? 'destructive' :
                      fareEstimate.demandLevel === 'HIGH' ? 'default' :
                      'outline'
                    }
                    className={
                      fareEstimate.demandLevel === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                      fareEstimate.demandLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-500' :
                      ''
                    }
                  >
                    {fareEstimate.demandLevel}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Searching Driver */}
      {currentStep === 'searching-driver' && (
        <Card className="bg-card border border-border/20">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Finding nearby drivers...
              </h3>
              <p className="text-sm text-muted-foreground">
                We're connecting you with available drivers in your area
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated wait time: 3-5 minutes</span>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-sm">Your safety is our priority</AlertTitle>
              <AlertDescription className="text-xs">
                All drivers are verified and rated. You can track your driver in real-time once matched.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('select-locations');
                setRetryCount(0);
              }}
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cancel & Change Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request Button */}
      {currentStep !== 'searching-driver' && (
        <Card className="bg-card border border-border/20">
          <CardContent className="p-6">
            {currentStep === 'select-locations' && !canProceed && (
              <p className="text-sm text-muted-foreground text-center">
                Please select pickup and dropoff locations to continue
              </p>
            )}

            {currentStep === 'select-locations' && canProceed && (
              <Button
                onClick={() => {
                  updateFareEstimate();
                  setCurrentStep('confirm-details');
                }}
                className="w-full h-12 text-base"
                size="lg"
              >
                Review Trip Details
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}

            {currentStep === 'confirm-details' && (
              <Button
                onClick={handleRequestTrip}
                disabled={isLoading}
                className="w-full h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Requesting Ride...
                  </>
                ) : (
                  <>
                    <Car className="mr-2 h-5 w-5" />
                    Request Ride - ${fareEstimate?.estimatedFare?.toFixed(2)}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
