// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import type { Pharmacy } from '../types';
import { Spinner } from './Spinner';
import { Alert } from './Alert';

declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element | null, opts?: any);
        panTo(latLng: any): void;
        setZoom(zoom: number): void;
        getZoom(): number | undefined;
      }
      class Marker {
        constructor(opts?: any);
        setMap(map: Map | null): void;
        getPosition(): any;
        setAnimation(animation: any | null): void;
        addListener(eventName: string, handler: () => void): void;
      }
      class InfoWindow {
        constructor(opts?: any);
        setContent(content: string | Node): void;
        open(options: { map: Map; anchor: Marker }): void;
        close(): void;
      }
      const SymbolPath: {
        CIRCLE: any;
      };
      const Animation: {
        BOUNCE: any;
      };
    }
  }
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}


interface MapProps {
  userLocation?: { lat: number; lng: number };
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  onPharmacySelect: (pharmacy: Pharmacy) => void;
}

let mapsApiLoaded: Promise<void> | null = null;
const loadMapsApi = (apiKey: string): Promise<void> => {
    if (mapsApiLoaded) {
        return mapsApiLoaded;
    }
    
    mapsApiLoaded = new Promise((resolve, reject) => {
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
            resolve();
            return;
        }

        window.initMap = () => {
            resolve();
            delete window.initMap;
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
            mapsApiLoaded = null;
            delete window.initMap;
            reject(new Error('The Google Maps script failed to load. Please check your network connection.'));
        };

        document.head.appendChild(script);
    });
    return mapsApiLoaded;
};

export const Map: React.FC<MapProps> = ({ userLocation, pharmacies, selectedPharmacy, onPharmacySelect }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
  const markersRef = React.useRef<Record<string, google.maps.Marker>>({});
  const infoWindowRef = React.useRef<google.maps.InfoWindow | null>(null);
  const [mapStatus, setMapStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<React.ReactNode | null>(null);

  React.useEffect(() => {
    // FIX: Aligned API key usage with the specified coding guidelines (process.env.API_KEY) to resolve TypeScript error on line 94.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        setErrorMessage(<span>The necessary <strong>API_KEY</strong> environment variable is not configured. The map cannot be loaded.</span>);
        setMapStatus('error');
        return;
    }
    
    loadMapsApi(apiKey)
      .then(() => setMapStatus('loaded'))
      .catch((err: Error) => {
        console.error("Google Maps API Error:", err);
        const detailedError = (
            <div>
                <strong className="font-semibold block mb-1">Google Map failed to load.</strong>
                <p className="mb-2">
                    This is likely due to an <code className="text-sm bg-red-100 text-red-800 px-1 py-0.5 rounded">InvalidKeyMapError</code>. Please check your Google Maps Platform setup.
                    See the official <a href="https://developers.google.com/maps/documentation/javascript/error-messages#invalid-key-map-error" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">error guide</a> for details.
                </p>
                <p className="font-medium mt-3 mb-1">Most common causes:</p>
                <ul className="list-disc list-inside text-left space-y-1">
                    <li><strong>Billing Not Enabled:</strong> The Google Cloud project linked to your API key MUST have a billing account enabled.</li>
                    <li><strong>Invalid API Key:</strong> The key provided in your environment variables might be incorrect or have typos.</li>
                    <li><strong>API Not Enabled:</strong> The <strong>"Maps JavaScript API"</strong> service is not enabled in your Google Cloud project.</li>
                    <li><strong>Key Restrictions:</strong> Your API key has restrictions (e.g., domain referrers) that prevent it from being used here.</li>
                </ul>
            </div>
        );
        setErrorMessage(detailedError);
        setMapStatus('error');
      });
  }, []);

  // Initialize map instance
  React.useEffect(() => {
    if (mapStatus === 'loaded' && mapRef.current && !mapInstanceRef.current) {
      try {
        const firstPharmacy = pharmacies.find(p => p.latitude && p.longitude);
        const center = userLocation ?? (firstPharmacy ? { lat: firstPharmacy.latitude!, lng: firstPharmacy.longitude! } : { lat: 20.5937, lng: 78.9629 }); // Default to India center

        const map = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: userLocation || firstPharmacy ? 14 : 5,
          mapId: 'GENMEDS_MAP_ID',
          disableDefaultUI: true,
          zoomControl: true,
        });
        mapInstanceRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        // User marker
        if (userLocation) {
            new window.google.maps.Marker({
              position: userLocation,
              map,
              title: 'Your Location',
              icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
              },
            });
        }
      } catch (e) {
          console.error("Error creating Google Map instance:", e);
          setErrorMessage("An unexpected error occurred while rendering the map.");
          setMapStatus('error');
      }
    }
  }, [mapStatus, userLocation, pharmacies]);

  // Update pharmacy markers when list changes
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (mapStatus !== 'loaded' || !map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: google.maps.Marker) => marker.setMap(null));
    markersRef.current = {};

    // Create new markers
    pharmacies.forEach((pharmacy) => {
        if (pharmacy.latitude && pharmacy.longitude) {
            const key = `${pharmacy.name}|${pharmacy.address}`;
            const marker = new window.google.maps.Marker({
                position: { lat: pharmacy.latitude, lng: pharmacy.longitude },
                map,
                title: pharmacy.name,
                animation: null,
            });
            markersRef.current[key] = marker;

            marker.addListener('click', () => {
                onPharmacySelect(pharmacy);
            });
        }
    });

    if(!userLocation && pharmacies.length > 0) {
        const firstPharmacyWithLocation = pharmacies.find(p => p.latitude && p.longitude);
        if(firstPharmacyWithLocation) {
             map.panTo({ lat: firstPharmacyWithLocation.latitude!, lng: firstPharmacyWithLocation.longitude! });
             map.setZoom(14);
        }
    }


  }, [pharmacies, mapStatus, onPharmacySelect, userLocation]);

  // Handle selections from the parent component
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) return;
    
    if (!selectedPharmacy) {
        infoWindow.close();
        Object.values(markersRef.current).forEach((m: google.maps.Marker) => m.setAnimation(null));
        return;
    }

    const key = `${selectedPharmacy.name}|${selectedPharmacy.address}`;
    const marker = markersRef.current[key];
    
    if (marker) {
        map.panTo(marker.getPosition()!);
        if (map.getZoom()! < 15) {
            map.setZoom(15);
        }

        const content = `
            <div style="font-family: sans-serif; max-width: 200px;">
                <h3 style="margin: 0 0 5px 0; font-size: 1rem; font-weight: bold;">${selectedPharmacy.name}</h3>
                <p style="margin: 0; font-size: 0.8rem;">${selectedPharmacy.address}</p>
            </div>`;
        infoWindow.setContent(content);
        infoWindow.open({ map, anchor: marker });

        Object.values(markersRef.current).forEach((m: google.maps.Marker) => m.setAnimation(null));
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => {
            marker.setAnimation(null);
        }, 1400);
    }
  }, [selectedPharmacy]);

  if (mapStatus === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <Spinner />
        <span className="ml-2 text-slate-500">Loading Map...</span>
      </div>
    );
  }

  if (mapStatus === 'error') {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-100 p-4">
            <Alert type="warning" message={errorMessage || "Something went wrong loading the map."} />
        </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
};