import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom rider icon (orange circle with motorcycle symbol)
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

// Customer location icon (green circle with home symbol)
const homeIcon = new L.DivIcon({
    className: 'home-marker',
    html: `<div style="
    width: 40px; 
    height: 40px; 
    background: #22c55e; 
    border-radius: 50%; 
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  ">🏠</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

interface RiderLocation {
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface OrderTrackingMapProps {
    orderId: string;
    riderId: string;
    customerAddress: string;
    customerLat?: number;
    customerLng?: number;
    onDelivered?: () => void;
}

// Component to recenter map when rider moves
function MapController({ riderPosition }: { riderPosition: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (riderPosition) {
            map.flyTo(riderPosition, map.getZoom(), { duration: 1 });
        }
    }, [riderPosition, map]);

    return null;
}

export default function OrderTrackingMap({
    orderId,
    riderId,
    customerAddress,
    customerLat,
    customerLng,
    onDelivered
}: OrderTrackingMapProps) {
    const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deliveryStatus, setDeliveryStatus] = useState<string>('in_delivery');

    // Default center (Italy)
    const defaultCenter: [number, number] = [45.4642, 9.1900]; // Milan
    const customerPosition: [number, number] | null =
        customerLat && customerLng ? [customerLat, customerLng] : null;

    useEffect(() => {
        // Load initial rider location
        loadRiderLocation();

        // Subscribe to realtime rider location updates
        const locationChannel = supabase
            .channel(`rider-location-${riderId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'rider_locations',
                filter: `rider_id=eq.${riderId}`
            }, (payload) => {
                console.log('📍 Rider location update:', payload.new);
                setRiderLocation(payload.new as RiderLocation);
            })
            .subscribe();

        // Subscribe to order status updates
        const orderChannel = supabase
            .channel(`order-status-${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            }, (payload) => {
                const newStatus = (payload.new as any).delivery_status;
                setDeliveryStatus(newStatus);
                if (newStatus === 'delivered' && onDelivered) {
                    onDelivered();
                }
            })
            .subscribe();

        return () => {
            locationChannel.unsubscribe();
            orderChannel.unsubscribe();
        };
    }, [riderId, orderId, onDelivered]);

    const loadRiderLocation = async () => {
        const { data, error } = await supabase
            .from('rider_locations')
            .select('*')
            .eq('rider_id', riderId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (!error && data) {
            setRiderLocation(data);
        }
        setIsLoading(false);
    };

    const riderPosition: [number, number] | null = riderLocation
        ? [riderLocation.latitude, riderLocation.longitude]
        : null;

    // Calculate distance between rider and customer (if both positions available)
    const calculateDistance = () => {
        if (!riderPosition || !customerPosition) return null;

        const R = 6371; // Earth's radius in km
        const dLat = (customerPosition[0] - riderPosition[0]) * Math.PI / 180;
        const dLon = (customerPosition[1] - riderPosition[1]) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(riderPosition[0] * Math.PI / 180) * Math.cos(customerPosition[0] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const distance = calculateDistance();

    if (deliveryStatus === 'delivered') {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #22c55e20, #22c55e10)',
                borderRadius: '20px',
                border: '2px solid #22c55e40'
            }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ fontSize: '20px', color: '#22c55e', marginBottom: '8px' }}>
                    Ordine Consegnato!
                </h3>
                <p style={{ color: '#666' }}>Il tuo ordine è arrivato. Buon appetito!</p>
            </div>
        );
    }

    return (
        <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '2px solid #e2e8f0',
            background: 'white'
        }}>
            {/* Status Header */}
            <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #ea580c, #fb923c)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        background: 'white',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                    }} />
                    <span style={{ fontWeight: 'bold' }}>🛵 Rider in Arrivo</span>
                </div>
                {distance && (
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '14px'
                    }}>
                        ~{distance} km
                    </div>
                )}
            </div>

            {/* Map */}
            <div style={{ height: '300px' }}>
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
                        center={riderPosition || customerPosition || defaultCenter}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {riderPosition && (
                            <Marker position={riderPosition} icon={riderIcon}>
                                <Popup>🛵 Il tuo rider è qui!</Popup>
                            </Marker>
                        )}

                        {customerPosition && (
                            <Marker position={customerPosition} icon={homeIcon}>
                                <Popup>🏠 {customerAddress}</Popup>
                            </Marker>
                        )}

                        <MapController riderPosition={riderPosition} />
                    </MapContainer>
                )}
            </div>

            {/* Info Footer */}
            <div style={{
                padding: '16px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                fontSize: '14px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span>📍</span>
                <span>{customerAddress}</span>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
        </div>
    );
}
