/**
 * FCM Service for Customer App
 * Handles push notification registration and device token management
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';

class FCMService {
    private static instance: FCMService;
    private isInitialized = false;
    private fcmToken: string | null = null;

    private constructor() { }

    public static getInstance(): FCMService {
        if (!FCMService.instance) {
            FCMService.instance = new FCMService();
        }
        return FCMService.instance;
    }

    /**
     * Check if push notifications are available (native platform only)
     */
    public isAvailable(): boolean {
        return Capacitor.isNativePlatform();
    }

    /**
     * Initialize FCM - request permissions and register for push notifications
     */
    public async initialize(): Promise<boolean> {
        if (!this.isAvailable()) {
            console.log('📱 [FCM] Not available - running in browser');
            return false;
        }

        if (this.isInitialized) {
            console.log('⚠️ [FCM] Already initialized');
            return true;
        }

        try {
            console.log('🚀 [FCM] Initializing FCM for customer app...');

            // Request permissions
            console.log('🔐 [FCM] Requesting permissions...');
            const permissionResult = await this.requestPermissions();
            if (!permissionResult) {
                console.error('❌ [FCM] Permission denied');
                return false;
            }
            console.log('✅ [FCM] Permissions granted');

            // Setup listeners first
            console.log('📬 [FCM] Setting up notification listeners...');
            await this.setupNotificationListeners();

            // Get FCM token
            console.log('🔑 [FCM] Registering for push notifications...');
            const tokenResult = await this.registerForPush();
            if (!tokenResult) {
                console.error('❌ [FCM] Failed to register');
                return false;
            }

            this.isInitialized = true;
            console.log('✅ [FCM] Customer app FCM initialization complete!');
            return true;

        } catch (error) {
            console.error('❌ [FCM] Initialization failed:', error);
            return false;
        }
    }

    private async requestPermissions(): Promise<boolean> {
        try {
            const result = await PushNotifications.requestPermissions();
            return result.receive === 'granted';
        } catch (error) {
            console.error('[FCM] Permission error:', error);
            return false;
        }
    }

    private async registerForPush(): Promise<boolean> {
        try {
            await PushNotifications.register();
            return true;
        } catch (error) {
            console.error('[FCM] Registration error:', error);
            return false;
        }
    }

    private async setupNotificationListeners(): Promise<void> {
        // Listener for when registration completes - save token
        PushNotifications.addListener('registration', async (token) => {
            console.log('✅ [FCM] Registration success, token:', token.value.substring(0, 30) + '...');
            this.fcmToken = token.value;
            await this.saveFCMTokenToDatabase(token.value);
        });

        // Listener for registration errors
        PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ [FCM] Registration error:', error);
        });

        // Listener for when notification is received (app in foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('📬 [FCM] Push notification received (foreground):', notification);
            // The NotificationListener component handles the UI
            // Dispatch a custom event that NotificationListener can listen to
            window.dispatchEvent(new CustomEvent('fcm-notification', {
                detail: {
                    title: notification.title,
                    body: notification.body,
                    data: notification.data
                }
            }));
        });

        // Listener for when notification is tapped (app in background/closed)
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('👆 [FCM] Notification tapped:', action);
            // Handle navigation based on notification data if needed
            const data = action.notification.data;
            if (data?.type === 'order_update') {
                // Could navigate to order details
                console.log('📦 Order update notification tapped');
            }
        });
    }

    /**
     * Save FCM token to database
     * Associates with user_id if logged in, otherwise saves without user association
     */
    private async saveFCMTokenToDatabase(token: string): Promise<boolean> {
        try {
            console.log('💾 [FCM] Saving token to database...');

            // Check if user is logged in
            const email = localStorage.getItem('customer_email');
            let userId: string | null = null;

            if (email) {
                const { data: userData } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (userData) {
                    userId = userData.id;
                }
            }

            const { error } = await supabase
                .from('devices')
                .upsert({
                    fcm_token: token,
                    user_id: userId, // Associate with user if logged in
                    device_info: {
                        platform: Capacitor.getPlatform(),
                        app_type: 'customer', // Distinguish from admin app
                        app_version: '1.0.0',
                        timestamp: new Date().toISOString(),
                    },
                }, {
                    onConflict: 'fcm_token',
                });

            if (error) {
                console.error('❌ [FCM] Failed to save token:', error);
                return false;
            }

            console.log('✅ [FCM] Token saved to database!', userId ? `(User: ${userId})` : '(Anonymous)');
            return true;

        } catch (error) {
            console.error('❌ [FCM] Error saving token:', error);
            return false;
        }
    }

    /**
     * Update device association when user logs in
     */
    public async associateWithUser(userId: string): Promise<void> {
        if (!this.fcmToken) {
            console.log('⚠️ [FCM] No token to associate');
            return;
        }

        try {
            const { error } = await supabase
                .from('devices')
                .update({ user_id: userId })
                .eq('fcm_token', this.fcmToken);

            if (error) {
                console.error('❌ [FCM] Failed to associate user:', error);
            } else {
                console.log('✅ [FCM] Device associated with user:', userId);
            }
        } catch (error) {
            console.error('❌ [FCM] Error associating user:', error);
        }
    }

    /**
     * Remove user association when user logs out
     */
    public async disassociateUser(): Promise<void> {
        if (!this.fcmToken) return;

        try {
            const { error } = await supabase
                .from('devices')
                .update({ user_id: null })
                .eq('fcm_token', this.fcmToken);

            if (error) {
                console.error('❌ [FCM] Failed to disassociate user:', error);
            } else {
                console.log('✅ [FCM] Device disassociated from user');
            }
        } catch (error) {
            console.error('❌ [FCM] Error disassociating user:', error);
        }
    }

    public getToken(): string | null {
        return this.fcmToken;
    }
}

export default FCMService.getInstance();
