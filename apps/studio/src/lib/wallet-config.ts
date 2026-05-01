
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
export const config = getDefaultConfig({
  appName: 'AIX Studio',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet],
});
