import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.timeoutpizza.rider',
    appName: 'Time Out Rider',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        Geolocation: {
            // Enable background location tracking
        }
    }
};

export default config;
