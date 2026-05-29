import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vintly.app',
  appName: 'Vintly',
  webDir: 'dist',
  backgroundColor: '#0b0f1a',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#7c5cff',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0b0f1a',
    },
  },
}

export default config
