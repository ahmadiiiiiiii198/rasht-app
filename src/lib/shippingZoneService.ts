/**
 * Shipping Zone Service for Customer App
 * Based on RuralPizza's shippingZoneService
 * Handles delivery address validation and zone-based pricing
 */

import { supabase } from './supabase';

interface ShippingZoneSettings {
    enabled: boolean;
    restaurantAddress: string;
    restaurantLat: number;
    restaurantLng: number;
    maxDeliveryDistance: number; // in kilometers
    deliveryFee: number;
    freeDeliveryThreshold: number;
    googleMapsApiKey: string;
}

interface DeliveryZone {
    id: string;
    name: string;
    maxDistance: number;
    deliveryFee: number;
    estimatedTime: string;
    isActive: boolean;
}

export interface AddressValidationResult {
    isValid: boolean;
    isWithinZone: boolean;
    distance: number;
    deliveryFee: number;
    estimatedTime: string;
    formattedAddress: string;
    coordinates: { lat: number; lng: number };
    error?: string;
}

class ShippingZoneService {
    private settings: ShippingZoneSettings;
    private deliveryZones: DeliveryZone[];
    private isInitialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {
        // Default settings for Efes Kebap Torino
        this.settings = {
            enabled: true,
            restaurantAddress: 'Via Roma, 10128 Torino TO, Italy',
            restaurantLat: 45.0703,
            restaurantLng: 7.6869,
            maxDeliveryDistance: 10, // 10km default
            deliveryFee: 2.50,
            freeDeliveryThreshold: 35.00,
            googleMapsApiKey: ''
        };
        this.deliveryZones = [];
        this.initializationPromise = this.loadSettings();
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.isInitialized && this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    private async loadSettings() {
        try {
            console.log('🔄 Loading shipping settings from database...');

            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'shippingZoneSettings')
                .single();

            if (!error && data && data.value) {
                const defaultSettings = { ...this.settings };
                this.settings = { ...defaultSettings, ...data.value };
                console.log('✅ Shipping settings loaded from database');
            } else {
                console.log('⚠️ No shipping settings found, using defaults');
            }

            // Load delivery zones
            const { data: zonesData, error: zonesError } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'deliveryZones')
                .single();

            if (!zonesError && zonesData && zonesData.value) {
                this.deliveryZones = zonesData.value;
                console.log('✅ Delivery zones loaded:', this.deliveryZones.length, 'zones');
            } else {
                // Initialize default zones
                this.deliveryZones = [
                    { id: '1', name: 'Zona 1 (0-3km)', maxDistance: 3, deliveryFee: 2.00, estimatedTime: '20-30 minuti', isActive: true },
                    { id: '2', name: 'Zona 2 (3-6km)', maxDistance: 6, deliveryFee: 3.50, estimatedTime: '30-45 minuti', isActive: true },
                    { id: '3', name: 'Zona 3 (6-10km)', maxDistance: 10, deliveryFee: 5.00, estimatedTime: '40-55 minuti', isActive: true }
                ];
                console.log('⚠️ Using default delivery zones');
            }
        } catch (error) {
            console.error('Failed to load shipping zone settings:', error);
        } finally {
            this.isInitialized = true;
        }
    }

    // Calculate distance using Haversine formula
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Geocode using OpenStreetMap Nominatim (free)
    private async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
        try {
            console.log('🌍 Geocoding address with Nominatim:', address);

            // Ensure address includes Italy for better results
            const searchAddress = address.toLowerCase().includes('italia') || address.toLowerCase().includes('italy')
                ? address
                : `${address}, Torino, Italia`;

            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&addressdetails=1`;

            const response = await fetch(url, {
                headers: { 'User-Agent': 'Time Out Pizza Delivery App' }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                console.log('✅ Geocoding successful:', result.display_name);
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    formattedAddress: result.display_name
                };
            } else {
                console.error('❌ Geocoding failed: No results');
                return null;
            }
        } catch (error) {
            console.error('❌ Geocoding network error:', error);
            throw error; // Throw error so validateDeliveryAddress can catch it and use fallback
        }
    }

    // Find delivery zone based on distance
    private findDeliveryZone(distance: number): DeliveryZone | null {
        const activeZones = this.deliveryZones.filter(zone => zone.isActive);

        for (const zone of activeZones.sort((a, b) => a.maxDistance - b.maxDistance)) {
            if (distance <= zone.maxDistance) {
                return zone;
            }
        }

        return null;
    }

    // Validate delivery address
    public async validateDeliveryAddress(address: string, orderAmount: number = 0): Promise<AddressValidationResult> {
        await this.ensureInitialized();

        if (!this.settings.enabled) {
            return {
                isValid: true,
                isWithinZone: true,
                distance: 0,
                deliveryFee: this.settings.deliveryFee,
                estimatedTime: '30-45 minuti',
                formattedAddress: address,
                coordinates: { lat: 0, lng: 0 }
            };
        }

        try {
            const geocodeResult = await this.geocodeAddress(address);

            if (!geocodeResult) {
                return {
                    isValid: false,
                    isWithinZone: false,
                    distance: 0,
                    deliveryFee: 0,
                    estimatedTime: 'N/A',
                    formattedAddress: address,
                    coordinates: { lat: 0, lng: 0 },
                    error: 'Indirizzo non trovato. Controlla e riprova.'
                };
            }

            const distance = this.calculateDistance(
                this.settings.restaurantLat,
                this.settings.restaurantLng,
                geocodeResult.lat,
                geocodeResult.lng
            );

            if (distance > this.settings.maxDeliveryDistance) {
                return {
                    isValid: true,
                    isWithinZone: false,
                    distance,
                    deliveryFee: 0,
                    estimatedTime: 'N/A',
                    formattedAddress: geocodeResult.formattedAddress,
                    coordinates: geocodeResult,
                    error: `Spiacenti, non consegniamo in questa zona. Distanza massima: ${this.settings.maxDeliveryDistance}km`
                };
            }

            const deliveryZone = this.findDeliveryZone(distance);

            if (!deliveryZone) {
                return {
                    isValid: true,
                    isWithinZone: false,
                    distance,
                    deliveryFee: 0,
                    estimatedTime: 'N/A',
                    formattedAddress: geocodeResult.formattedAddress,
                    coordinates: geocodeResult,
                    error: 'Nessuna zona di consegna configurata per questa distanza.'
                };
            }

            // Free delivery if order amount exceeds threshold
            const deliveryFee = orderAmount >= this.settings.freeDeliveryThreshold ? 0 : deliveryZone.deliveryFee;

            return {
                isValid: true,
                isWithinZone: true,
                distance,
                deliveryFee,
                estimatedTime: deliveryZone.estimatedTime,
                formattedAddress: geocodeResult.formattedAddress,
                coordinates: geocodeResult
            };

        } catch (error) {
            console.error('Address validation error:', error);

            // FALLBACK: If geocoding API fails, allow the order with a default fee
            // This prevents blocking orders when external service is down
            console.log('⚠️ Using fallback validation due to API error');
            const defaultFee = orderAmount >= this.settings.freeDeliveryThreshold ? 0 : this.settings.deliveryFee;

            return {
                isValid: true, // Optimistically assume valid
                isWithinZone: true,
                distance: 0,
                deliveryFee: defaultFee,
                estimatedTime: '30-45 minuti',
                formattedAddress: address,
                coordinates: { lat: 0, lng: 0 },
                // Use a different error message or no error to indicate fallback
                error: undefined
            };
        }
    }

    // Get settings
    public async getSettings(): Promise<ShippingZoneSettings> {
        await this.ensureInitialized();
        return { ...this.settings };
    }

    // Force reload
    public async reloadFromDatabase(): Promise<void> {
        this.isInitialized = false;
        this.initializationPromise = this.loadSettings();
        await this.initializationPromise;
    }
}

// Export singleton
export const shippingZoneService = new ShippingZoneService();
export default shippingZoneService;
