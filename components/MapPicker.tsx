import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Marker Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    onConfirm: (address: string) => void;
    onClose: () => void;
    initialAddress?: string;
}

// Component to handle map center changes
const CenterHandler = ({ onCenterChange, searchLocation }: { onCenterChange: (lat: number, lng: number) => void, searchLocation?: [number, number] | null }) => {
    const map = useMap();

    // Handle programmatic pan to search result
    useEffect(() => {
        if (searchLocation) {
            map.flyTo(searchLocation, 16, { duration: 1.5 });
        }
    }, [searchLocation, map]);

    useMapEvents({
        moveend: () => {
            // Only allow manual move updates if we are not currently flying? 
            // Actually map events fire after flyTo ends properly usually, but let's just trigger.
            const center = map.getCenter();
            onCenterChange(center.lat, center.lng);
        },
    });

    return null;
};

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
}

const MapPicker: React.FC<MapPickerProps> = ({ onConfirm, onClose }) => {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [center, setCenter] = useState<[number, number]>([31.2304, 121.4737]);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchLocation, setSearchLocation] = useState<[number, number] | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchAddress = async (lat: number, lng: number) => {
        setLoading(true);
        // Don't wipe address immediately to avoid flickering "Loading..." too much
        // setAddress('正在获取地址...'); 
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=zh-CN`);
            const data = await response.json();

            if (data && data.display_name) {
                const addr = data.display_name;
                let simpleAddr = addr;
                if (data.name) {
                    simpleAddr = data.name;
                } else {
                    simpleAddr = addr.split(',')[0];
                }
                setAddress(simpleAddr);
            } else {
                setAddress('未知位置');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            setAddress('无法获取地址');
        } finally {
            setLoading(false);
        }
    };

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length < 1) { // Allow single character search (important for Chinese)
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // Get map bounds for prioritization
                // Using a simple bounding box around the center roughly 50km
                const boxSize = 0.5;
                const viewbox = `${center[1] - boxSize},${center[0] + boxSize},${center[1] + boxSize},${center[0] - boxSize}`;

                // Add countrycodes=cn for China optimization
                // Add viewbox and bounded=0 (prefer viewbox but don't restrict)
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=zh-CN&limit=10&countrycodes=cn&viewbox=${viewbox}&bounded=0`;

                const response = await fetch(url);
                if (!response.ok) throw new Error('Network error');

                const data = await response.json();
                setSearchResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, center]);

    const handleSelectResult = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        // 1. Update map execution logic
        setSearchLocation([lat, lon]);

        // 2. Set address text immediately from search result to be snappy
        const name = result.name || result.display_name.split(',')[0];
        setAddress(name);

        // 3. Clear search UI
        setSearchResults([]);
        setSearchQuery('');
        // Blur input
        inputRef.current?.blur();
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header Area containing Search Bar */}
            <div className="flex flex-col bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] shadow-sm z-20 pb-2">

                {/* Top Actions Bar */}
                <div className="flex items-center justify-between px-4 h-11 shrink-0 pt-safe">
                    <button onClick={onClose} className="text-text-secondary text-[16px]">取消</button>
                    <h3 className="text-[17px] font-semibold text-black">选择场地</h3>
                    <button
                        onClick={() => { if (address && !loading) onConfirm(address); }}
                        disabled={!address || loading}
                        className={`text-ios-blue text-[16px] font-bold ${(!address || loading) ? 'opacity-50' : ''}`}
                    >
                        确定
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 mt-1 relative">
                    <div className="flex items-center bg-[#767680]/12 rounded-xl px-2 h-9">
                        <span className="material-symbols-outlined text-text-secondary/70 text-[20px] mr-1.5">search</span>
                        <input
                            ref={inputRef}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none p-0 text-[16px] text-black placeholder:text-text-secondary/70 focus:ring-0 leading-normal"
                            placeholder="搜索地点 (如: 源深体育中心)"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-text-secondary/70">
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {(searchResults.length > 0 || isSearching) && searchQuery && (
                        <div className="absolute top-full left-0 right-0 bg-white shadow-xl max-h-[60vh] overflow-y-auto z-50 mt-2 mx-4 rounded-xl border border-[#E5E5EA]">
                            {isSearching && (
                                <div className="p-4 text-center text-text-secondary text-sm">正在搜索周边...</div>
                            )}
                            {searchResults.map((result) => (
                                <div
                                    key={result.place_id}
                                    onClick={() => handleSelectResult(result)}
                                    className="flex items-center gap-3 p-3.5 border-b border-[#E5E5EA] last:border-none active:bg-[#F2F2F7] cursor-pointer"
                                >
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-[#767680]/12 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-text-secondary text-[18px]">location_on</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[16px] font-medium text-black truncate">
                                            {result.name || result.display_name.split(',')[0]}
                                        </div>
                                        <div className="text-[12px] text-text-secondary truncate">
                                            {result.display_name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!isSearching && searchResults.length === 0 && (
                                <div className="p-4 text-center text-text-secondary text-sm">
                                    <p>未找到相关地点</p>
                                    <p className="text-[10px] mt-1 opacity-60">尝试输入更简单的关键词，或仅保留地名</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative bg-[#F2F2F7]">
                <MapContainer
                    center={center}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; GeoQ'
                        url="https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}"
                    />
                    <CenterHandler onCenterChange={fetchAddress} searchLocation={searchLocation} />
                </MapContainer>

                {/* Center Pin */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none flex flex-col items-center justify-center -mt-8">
                    <span className="material-symbols-outlined text-[40px] text-ios-blue drop-shadow-md">location_on</span>
                    <div className="w-2 h-2 rounded-full bg-black/20 blur-[2px] mt-[-6px]"></div>
                </div>

                {/* Bottom Address Card */}
                {!searchQuery && (
                    <div className="absolute bottom-8 left-4 right-4 z-[1000] animate-in slide-in-from-bottom duration-300">
                        <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#E5E5EA]">
                            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <span>已选位置</span>
                                {loading && <span className="w-2 h-2 rounded-full bg-text-secondary animate-pulse"></span>}
                            </p>
                            <div className="flex items-start gap-3">
                                <span className={`material-symbols-outlined text-[24px] mt-0.5 ${loading ? 'text-text-secondary' : 'text-ios-blue'}`}>
                                    {loading ? 'pending' : 'storefront'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[17px] font-bold leading-tight ${loading ? 'text-text-secondary' : 'text-text-main'}`}>
                                        {address || '移动地图选择位置...'}
                                    </p>
                                    {loading && <p className="text-[12px] text-text-secondary mt-1">正在解析地址...</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPicker;
