import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eagleline.fleet',
  appName: 'eagleline',
  webDir: 'dist',
  // Hot-reload for development - uncomment and set your local dev server URL:
  // server: {
  //   url: "http://localhost:8080",
  //   cleartext: true
  // },
  plugins: {
    Geolocation: {
      permissions: ['geolocation']
    }
  }
};

export default config;
