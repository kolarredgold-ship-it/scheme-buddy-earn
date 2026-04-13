import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.techrola.app',
  appName: 'Techrola',
  webDir: 'dist',
  server: {
    url: "https://7eac2eb5-b4a3-41ef-b29f-f3605fab8301.lovableproject.com?forceHideBadge=true",
    cleartext: true
  }
};

export default config;
