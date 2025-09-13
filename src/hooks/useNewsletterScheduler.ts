import { useEffect, useRef } from 'react';
import { NewsletterService } from '@/services/newsletterService';

export const useNewsletterScheduler = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const processScheduledCampaigns = async () => {
      try {
        await NewsletterService.processScheduledCampaigns();
      } catch (error) {
        console.error('Error processing scheduled campaigns:', error);
      }
    };

    // Check for scheduled campaigns every minute
    intervalRef.current = setInterval(processScheduledCampaigns, 60000);

    // Also check immediately on mount
    processScheduledCampaigns();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  const forceCheck = async () => {
    try {
      await NewsletterService.processScheduledCampaigns();
    } catch (error) {
      console.error('Error in force check:', error);
    }
  };

  return { forceCheck };
};