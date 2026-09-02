import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gtduo.app',
  appName: 'GT Duo',
  webDir: 'out',
  server: {
    // Substitua pelo IP local da sua máquina (ex: 192.168.1.100:3000)
    // url: 'http://SEU_IP_LOCAL:3000',
    cleartext: true
  }
};

export default config;