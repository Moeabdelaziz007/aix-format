import { useLocalStorage } from './useLocalStorage';

export function useSettings() {
  const [vercelToken, setVercelToken] = useLocalStorage('aix_vercel_token', '');
  const [projectName, setProjectName] = useLocalStorage('aix_project_name', 'aix-studio-agents');
  const [notifications, setNotifications] = useLocalStorage('aix_notifications', true);
  const [kycRequired, setKycRequired] = useLocalStorage('aix_kyc_required', true);
  const [showAbomRisks, setShowAbomRisks] = useLocalStorage('aix_show_abom_risks', true);

  return {
    vercelToken,
    setVercelToken,
    projectName,
    setProjectName,
    notifications,
    setNotifications,
    kycRequired,
    setKycRequired,
    showAbomRisks,
    setShowAbomRisks,
  };
}
