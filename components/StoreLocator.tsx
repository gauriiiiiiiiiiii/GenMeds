// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { findPharmacies } from '../services/geminiService';
import type { Pharmacy } from '../types';
import { Spinner } from './Spinner';
import { Alert } from './Alert';
import { LocationMarkerIcon, PhoneIcon, SearchIcon, StarIcon } from './Icons';
import { Map } from './Map';

type Status = 'idle' | 'loading' | 'success' | 'error';
type SearchMode = 'idle' | 'current_location' | 'manual_location';
type ActiveTab = 'results' | 'favorites';

interface UserLocation {
    lat: number;
    lng: number;
}

const getPharmacyId = (pharmacy: Pharmacy) => `${pharmacy.name}|${pharmacy.address}`;

const getFavorites = (): Record<string, Pharmacy> => {
    try {
        const item = window.localStorage.getItem('favoritePharmacies');
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error("Error reading favorites from localStorage", error);
        return {};
    }
};

const saveFavorites = (favorites: Record<string, Pharmacy>) => {
    try {
        window.localStorage.setItem('favoritePharmacies', JSON.stringify(favorites));
    } catch (error) {
        console.error("Error saving favorites to localStorage", error);
    }
};

export const StoreLocator: React.FC = () => {
    const [status, setStatus] = React.useState<Status>('idle');
    const [searchMode, setSearchMode] = React.useState<SearchMode>('idle');
    const [stores, setStores] = React.useState<Pharmacy[]>([]);
    const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedStore, setSelectedStore] = React.useState<Pharmacy | null>(null);
    const [manualQuery, setManualQuery] = React.useState('');
    
    const [favorites, setFavorites] = React.useState<Record<string, Pharmacy>>(getFavorites);
    const [activeTab, setActiveTab] = React.useState<ActiveTab>('results');
    const [nameFilter, setNameFilter] = React.useState('');
    const [serviceFilters, setServiceFilters] = React.useState<string[]>([]);
    const [showJanaushadhiOnly, setShowJanaushadhiOnly] = React.useState<boolean>(false);

    const storeCardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

    React.useEffect(() => {
        if (selectedStore) {
            const key = getPharmacyId(selectedStore);
            const element = storeCardRefs.current[key];
            element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedStore]);

    const handleSearch = async (mode: 'current' | 'manual') => {
        setStatus('loading');
        setError(null);
        setStores([]);
        setSelectedStore(null);
        setActiveTab('results');

        try {
            let foundStores: Pharmacy[];
            if (mode === 'current') {
                setSearchMode('current_location');
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
                foundStores = await findPharmacies({ lat: latitude, lng: longitude });
            } else {
                if (!manualQuery.trim()) {
                    throw new Error("Please enter a location to search.");
                }
                setSearchMode('manual_location');
                setUserLocation(null);
                foundStores = await findPharmacies({ query: manualQuery });
            }
            setStores(foundStores);
            setStatus('success');
        } catch (err) {
            let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (err instanceof GeolocationPositionError) {
                 switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'You denied the request for Geolocation. Please enable it or search manually.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'The request to get user location timed out.';
                        break;
                }
            }
            setError(errorMessage);
            setStatus('error');
        }
    };
    
    const toggleFavorite = (pharmacy: Pharmacy) => {
        const id = getPharmacyId(pharmacy);
        const newFavorites = { ...favorites };
        if (newFavorites[id]) {
            delete newFavorites[id];
        } else {
            newFavorites[id] = pharmacy;
        }
        setFavorites(newFavorites);
        saveFavorites(newFavorites);
    };

    const toggleServiceFilter = (service: string) => {
        setServiceFilters(prev => 
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const favoriteList = React.useMemo(() => Object.values(favorites), [favorites]);

    const displayedStores = React.useMemo(() => {
        const sourceList = activeTab === 'results' ? stores : favoriteList;
        return sourceList.filter(store => {
            const nameMatch = store.name.toLowerCase().includes(nameFilter.toLowerCase());
            const janaushadhiMatch = !showJanaushadhiOnly || store.services?.some(s => s.toLowerCase().includes('jan aushadhi'));
            const serviceMatch = serviceFilters.length === 0 || serviceFilters.every(
                filter => store.services?.some(s => s.toLowerCase().includes(filter.toLowerCase()))
            );
            return nameMatch && serviceMatch && janaushadhiMatch;
        });
    }, [activeTab, stores, favoriteList, nameFilter, serviceFilters, showJanaushadhiOnly]);

    const allServices = React.useMemo(() => {
        const serviceSet = new Set<string>();
        stores.forEach(store => {
            store.services?.forEach(service => serviceSet.add(service));
        });
        // Exclude 'Jan Aushadhi' from general service filters as it has a dedicated toggle
        return Array.from(serviceSet).filter(s => !s.toLowerCase().includes('jan aushadhi'));
    }, [stores]);

    return (
        <div className="flex flex-col space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSearch('manual'); }} className="flex gap-2">
                    <input
                        type="text"
                        value={manualQuery}
                        onChange={(e) => setManualQuery(e.target.value)}
                        placeholder="Enter city or pincode..."
                        className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />
                    <button type="submit" className="bg-cyan-500 text-white font-bold p-2 rounded-md hover:bg-cyan-600 transition-colors flex items-center justify-center" aria-label="Search">
                        <SearchIcon />
                    </button>
                </form>
                <div className="flex items-center gap-2">
                    <hr className="flex-grow border-slate-200" />
                    <span className="text-xs font-semibold text-slate-400">OR</span>
                    <hr className="flex-grow border-slate-200" />
                </div>
                 <button
                    onClick={() => handleSearch('current')}
                    className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-full hover:bg-cyan-600 transition-colors flex items-center gap-2 mx-auto w-full justify-center"
                >
                   <LocationMarkerIcon className="w-5 h-5"/>
                    Use My Current Location
                </button>
            </div>

            {status === 'loading' && (
                <div className="flex flex-col items-center gap-2 text-slate-500 p-8">
                    <Spinner />
                    <p>Finding pharmacies...</p>
                </div>
            )}
            {status === 'error' && <Alert type="warning" message={error!} />}

            {(status === 'success' || favoriteList.length > 0) && (
                <div className="w-full text-left space-y-4">
                     <div className="h-80 w-full rounded-lg shadow-md border border-slate-200 overflow-hidden">
                        <Map
                            userLocation={userLocation}
                            pharmacies={displayedStores}
                            selectedPharmacy={selectedStore}
                            onPharmacySelect={setSelectedStore}
                        />
                    </div>

                    <div className="flex border-b border-slate-200">
                        <TabButton label="Search Results" isActive={activeTab === 'results'} onClick={() => setActiveTab('results')} count={stores.length}/>
                        <TabButton label="Favorites" isActive={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} count={favoriteList.length}/>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                         <h3 className="font-semibold">Filter Results</h3>
                         <input
                            type="text"
                            placeholder="Filter by name..."
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            className="w-full p-2 rounded-md border border-slate-300"
                         />
                         <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <label htmlFor="janaushadhi-toggle" className="font-semibold text-slate-700 cursor-pointer flex-grow">
                                Show only Jan Aushadhi stores
                            </label>
                            <button
                                id="janaushadhi-toggle"
                                role="switch"
                                aria-checked={showJanaushadhiOnly}
                                onClick={() => setShowJanaushadhiOnly(prev => !prev)}
                                className={`${
                                    showJanaushadhiOnly ? 'bg-cyan-500' : 'bg-slate-300'
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2`}
                            >
                                <span
                                    className={`${
                                        showJanaushadhiOnly ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>
                         {allServices.length > 0 && (
                            <div className="pt-4 border-t border-slate-200">
                                <h4 className="text-sm font-semibold text-slate-500 mb-2">Filter by other services:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {allServices.map(service => (
                                        <FilterChip key={service} label={service} isActive={serviceFilters.includes(service)} onClick={() => toggleServiceFilter(service)} />
                                    ))}
                                </div>
                            </div>
                         )}
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {displayedStores.length > 0 ? (
                            displayedStores.map((store) => {
                                const id = getPharmacyId(store);
                                return (
                                    <StoreCard 
                                        key={id} 
                                        store={store}
                                        ref={(el) => { storeCardRefs.current[id] = el; }}
                                        isSelected={selectedStore ? getPharmacyId(selectedStore) === id : false}
                                        onSelect={() => setSelectedStore(selectedStore && getPharmacyId(selectedStore) === id ? null : store)}
                                        isFavorite={!!favorites[id]}
                                        onToggleFavorite={() => toggleFavorite(store)}
                                    />
                                );
                            })
                        ) : (
                            <Alert type="info" message={`No ${activeTab === 'results' ? 'search results' : 'favorites'} match the current filters.`} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const StoreCard = React.forwardRef<HTMLDivElement, { store: Pharmacy, isSelected: boolean, onSelect: () => void, isFavorite: boolean, onToggleFavorite: () => void }>(({ store, isSelected, onSelect, isFavorite, onToggleFavorite }, ref) => {
    const mapsLink = (store.latitude && store.longitude)
        ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${store.address}`)}`;

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavorite();
    };

    return (
        <div 
            ref={ref}
            onClick={onSelect}
            className={`bg-white rounded-lg border shadow-sm p-4 cursor-pointer transition-all duration-300 ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200 hover:border-slate-300'}`}
        >
            <div className="flex justify-between items-start gap-2">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{store.name}</h3>
                    <p className="text-sm text-slate-500 font-semibold">{store.distance} away</p>
                </div>
                <button onClick={handleFavoriteClick} className="text-slate-400 hover:text-yellow-500" aria-label="Toggle Favorite">
                    <StarIcon filled={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-yellow-400' : ''}`} />
                </button>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                    <LocationMarkerIcon className="w-5 h-5 flex-shrink-0 text-slate-400 mt-0.5" />
                    <span>{store.address}</span>
                </div>
                {store.contact && (
                    <div className="flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 flex-shrink-0 text-slate-400" />
                        <span>{store.contact}</span>
                    </div>
                )}
                 {store.services && store.services.length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-2">
                         {store.services.map(service => <span key={service} className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-1 rounded-full">{service}</span>)}
                     </div>
                )}
            </div>
             <a 
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-3 text-sm bg-blue-500 text-white font-semibold py-1.5 px-3 rounded-full hover:bg-blue-600 transition-colors text-center w-full block"
            >
                Directions
            </a>
        </div>
    );
});

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; count: number }> = ({ label, isActive, onClick, count }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-1 p-2 text-center font-semibold border-b-2 transition-colors ${isActive ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
            {label} <span className="text-xs bg-slate-200 text-slate-600 font-bold rounded-full px-2 py-0.5">{count}</span>
        </button>
    )
};

const FilterChip: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${isActive ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    )
}