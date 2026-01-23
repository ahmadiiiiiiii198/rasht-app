import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crhmtzrnahdpgrpmxmjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaG10enJuYWhkcGdycG14bWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTk2NDYsImV4cCI6MjA4NDY5NTY0Nn0.Ig3jcGDMMVmOlSIp3G3Zy6sD-78mOYlpfIlc51ml2-k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Rider {
    id: string;
    name: string;
    phone: string;
    email: string;
    is_active: boolean;
}

export interface RiderLocation {
    id?: string;
    rider_id: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp?: string;
}

export interface DeliveryOrder {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    customer_lat?: number;
    customer_lng?: number;
    total_amount: number;
    delivery_status: string;
    notes?: string;
    special_instructions?: string;
    created_at: string;
}
