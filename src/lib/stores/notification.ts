import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'opponent-pick' | 'your-turn' | 'player-joined';
  message: string;
  timestamp: number;
}

function createNotificationStore() {
  const { subscribe, set, update } = writable<Notification | null>(null);
  
  return {
    subscribe,
    show: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const fullNotification: Notification = {
        ...notification,
        id,
        timestamp: Date.now()
      };
      set(fullNotification);
      
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        set(null);
      }, 4000);
    },
    dismiss: () => set(null)
  };
}

export const notificationStore = createNotificationStore();