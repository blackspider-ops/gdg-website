import { useEffect, useRef } from 'react';
import { CommunicationsService } from '@/services/communicationsService';

export const useTaskScheduler = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const checkOverdueTasks = async () => {
      try {
        const result = await CommunicationsService.checkOverdueTasks();
        
        if (result.success && result.marked > 0) {
          console.log(`✅ Marked ${result.marked} task(s) as overdue and sent ${result.notified} notification(s)`);
        }
      } catch (error) {
        console.error('Failed to check overdue tasks:', error);
      }
    };

    // Check for overdue tasks every 5 minutes (300000ms)
    // You can adjust this interval as needed
    intervalRef.current = setInterval(checkOverdueTasks, 300000);

    // Also check immediately on mount
    checkOverdueTasks();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  const forceCheck = async () => {
    try {
      return await CommunicationsService.checkOverdueTasks();
    } catch (error) {
      console.error('Failed to check overdue tasks:', error);
      return { 
        success: false, 
        marked: 0, 
        notified: 0, 
        message: 'Failed to check overdue tasks',
        error: error.message || 'Unknown error'
      };
    }
  };

  return { forceCheck };
};