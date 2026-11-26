import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.streammovies.app',
  appName: 'StreamMovies',
  webDir: 'dist',
  backgroundColor: '#141414',
  server: {
    androidScheme: 'https',
    // The app's pages load from https://com.streammovies.app inside the app.
    // YouTube embeds need a referrer that identifies the app.
    hostname: 'com.streammovies.app',
  },
  plugins: {
    SystemBars: {
      style: 'DARK',
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
