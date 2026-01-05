'use client';

/**
 * Location Autocomplete Component
 *
 * Provides Google Places autocomplete for location/address fields.
 * Implements BRD 5.2.2 - Location Auto-Suggest.
 *
 * @module location-autocomplete
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceResult {
  city: string;
  country: string;
  fullAddress: string;
  placeId: string;
  lat?: number;
  lng?: number;
}

interface LocationAutocompleteProps {
  /** Current location value */
  value: string;
  /** Callback when location changes */
  onChange: (value: string) => void;
  /** Callback with full place details */
  onPlaceSelect?: (place: PlaceResult) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Additional className */
  className?: string;
  /** Restrict to specific country codes (e.g., ['au', 'us']) */
  countryRestrictions?: string[];
  /** Disable the autocomplete */
  disabled?: boolean;
}

// Declare google types
declare global {
  interface Window {
    google?: typeof google;
    initGooglePlaces?: () => void;
  }
}

export default function LocationAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  label = 'Location',
  placeholder = 'Start typing a city or address...',
  required = false,
  className,
  countryRestrictions,
  disabled = false,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Load Google Places script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn('[LocationAutocomplete] Google Places API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsGoogleLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleLoaded(true));
      return;
    }

    // Load the script
    setIsLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsGoogleLoaded(true);
      setIsLoading(false);
    };

    script.onerror = () => {
      console.error('[LocationAutocomplete] Failed to load Google Places script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup autocomplete on unmount
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Initialize autocomplete when Google is loaded
  useEffect(() => {
    if (!isGoogleLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    const options: google.maps.places.AutocompleteOptions = {
      types: ['(cities)'], // Focus on cities
      fields: ['address_components', 'geometry', 'place_id', 'formatted_address'],
    };

    if (countryRestrictions && countryRestrictions.length > 0) {
      options.componentRestrictions = { country: countryRestrictions };
    }

    try {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    } catch (error) {
      console.error('[LocationAutocomplete] Error initializing autocomplete:', error);
    }
  }, [isGoogleLoaded, countryRestrictions]);

  // Handle place selection
  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (!place.address_components) {
      return;
    }

    // Extract city and country from address components
    let city = '';
    let country = '';
    let countryCode = '';

    place.address_components.forEach((component) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_1') && !city) {
        // Fallback to state/province if no city
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
        countryCode = component.short_name;
      }
    });

    const result: PlaceResult = {
      city,
      country,
      fullAddress: place.formatted_address || '',
      placeId: place.place_id || '',
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
    };

    // Update the input value
    const displayValue = city || place.formatted_address || '';
    setInputValue(displayValue);
    onChange(displayValue);

    // Call the place select callback with full details
    if (onPlaceSelect) {
      onPlaceSelect(result);
    }

    console.log('[LocationAutocomplete] Place selected:', result);
  }, [onChange, onPlaceSelect]);

  // Handle manual input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const showFallbackInput = !isGoogleLoaded && !isLoading;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="location-autocomplete" className="dark:text-foreground">
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </div>

        <Input
          ref={inputRef}
          id="location-autocomplete"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          required={required}
          className={cn(
            'pl-10 dark:bg-input dark:border-border dark:text-foreground',
            showFallbackInput && 'pr-24'
          )}
          autoComplete="off"
        />

        {showFallbackInput && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            Manual entry
          </span>
        )}
      </div>

      {!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <p className="text-xs text-muted-foreground">
          Location autocomplete unavailable. Enter location manually.
        </p>
      )}
    </div>
  );
}

/**
 * Hook for using Google Places autocomplete programmatically
 */
export function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsLoaded(true);
    }
  }, []);

  const getPlaceDetails = async (placeId: string): Promise<PlaceResult | null> => {
    if (!isLoaded) return null;

    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails(
        { placeId, fields: ['address_components', 'geometry', 'formatted_address'] },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
            resolve(null);
            return;
          }

          let city = '';
          let country = '';

          place.address_components?.forEach((component) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('country')) {
              country = component.long_name;
            }
          });

          resolve({
            city,
            country,
            fullAddress: place.formatted_address || '',
            placeId,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          });
        }
      );
    });
  };

  return { isLoaded, getPlaceDetails };
}
