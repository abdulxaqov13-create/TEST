import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.glassvote.app',
  appName: 'GlassVote',
  webDir: 'dist',
  server: {
    url: "http://172.20.10.3:3000",
    cleartext: true
  }
};

export default config;