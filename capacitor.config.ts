import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.edu.foco.tasks',
  appName: 'Foco',
  webDir: 'dist',
  plugins: {
    SystemBars: { insetsHandling: 'css', style: 'LIGHT' },
  },
};

export default config;
