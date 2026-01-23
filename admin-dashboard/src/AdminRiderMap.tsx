import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from './lib/supabase';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom rider icon
const riderIcon = new L.DivIcon({
    className: 'rider-marker',
    html: `<div style="
    width: 40px; 
    height: 40px; 
    background: #ea580c; 
    border-radius: 50%; 
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  ">🛵</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

interface RiderLocation {
    rider_id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    rider_name?: string;
}

interface AdminRiderMapProps {
    height?: string;
}

// Auto-fit map to markers
function MapBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);

    return null;
}

export default function AdminRiderMap({ height = '400px' }: AdminRiderMapProps) {
    const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
    const [riders, setRiders] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default center (Italy)
    const defaultCenter: [number, number] = [45.4642, 9.1900];

    useEffect(() => {
        loadRiders();
        loadRiderLocations();

        // Subscribe to real-time location updates
        const channel = supabase
            .channel('admin-rider-locations')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'rider_locations'
            }, (payload) => {
                const newLocation = payload.new as RiderLocation;
                setRiderLocations(prev => {
                    // Update or add location for this rider
                    const filtered = prev.filter(loc => loc.rider_id !== newLocation.rider_id);
                    return [...filtered, newLocation];
                });
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, []);

    const loadRiders = async () => {
        const { data } = await supabase
            .from('riders')
            .select('id, name')
            .eq('is_active', true);

        if (data) {
            setRiders(data);
        }
    };

    const loadRiderLocations = async () => {
        // Get latest location for each rider
        const { data } = await supabase
            .from('rider_locations')
            .select('rider_id, latitude, longitude, timestamp')
            .order('timestamp', { ascending: false });

        if (data) {
            // Get only the most recent location per rider
            const latestLocations: { [key: string]: RiderLocation } = {};
            data.forEach(loc => {
                if (!latestLocations[loc.rider_id]) {
                    latestLocations[loc.rider_id] = loc;
                }
            });
            setRiderLocations(Object.values(latestLocations));
        }
        setIsLoading(false);
    };

    const getRiderName = (riderId: string) => {
        return riders.find(r => r.id === riderId)?.name || 'Rider';
    };

    const positions: [number, number][] = riderLocations.map(loc => [loc.latitude, loc.longitude]);

    return (
        <div style={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            background: 'white',
            marginBottom: '24px'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #1e293b, #334155)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🗺️</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Mappa Rider in Tempo Reale</span>
                </div>
                <div style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#22c55e',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                    }} />
                    {riderLocations.length} rider attivi
                </div>
            </div>

            {/* Map */}
            <div style={{ height }}>
                {isLoading ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f1f5f9'
                    }}>
                        <span>Caricamento mappa...</span>
                    </div>
                ) : (
                    <MapContainer
                        center={positions.length > 0 ? positions[0] : defaultCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {riderLocations.map(location => (
                            <Marker
                                key={location.rider_id}
                                position={[location.latitude, location.longitude]}
                                icon={riderIcon}
                            >
                                <Popup>
                                    <div style={{ textAlign: 'center' }}>
                                        <strong>🛵 {getRiderName(location.rider_id)}</strong>
                                        <br />
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            Ultimo aggiornamento: {new Date(location.timestamp).toLocaleTimeString('it-IT')}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {positions.length > 0 && <MapBounds positions={positions} />}
                    </MapContainer>
                )}
            </div>

            {/* Legend */}
            {riderLocations.length > 0 && (
                <div style={{
                    padding: '12px 20px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap'
                }}>
                    {riderLocations.map(loc => (
                        <div
                            key={loc.rider_id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                background: 'white',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px'
                            }}
                        >
                            <span>🛵</span>
                            <span style={{ fontWeight: '600' }}>{getRiderName(loc.rider_id)}</span>
                            <span style={{
                                fontSize: '11px',
                                color: '#22c55e',
                                background: '#dcfce7',
                                padding: '2px 6px',
                                borderRadius: '4px'
                            }}>
                                Online
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
