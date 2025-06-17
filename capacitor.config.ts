import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.almauniversity.one',
  appName: 'AlmaUOne',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
    port: 3001,
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true
    },
    Camera: {
      permissions: ['camera']
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config; 