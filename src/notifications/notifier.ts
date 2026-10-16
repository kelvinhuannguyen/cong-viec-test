export type PermissionState = NotificationPermission | 'unsupported';

export interface AppNotification {
  title: string;
  body: string;
  taskId?: string;
}

export function getPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestPermission(): Promise<PermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function showNotification(notification: AppNotification, onOpenTask: (id: string) => void): void {
  if (getPermission() !== 'granted') return;
  try {
    const n = new Notification(notification.title, {
      body: notification.body,
      icon: '/pwa-192x192.png',
      tag: notification.taskId ?? 'daily-summary',
    });
    n.onclick = () => {
      window.focus();
      if (notification.taskId) onOpenTask(notification.taskId);
      n.close();
    };
  } catch {
    // Một số trình duyệt di động chỉ cho phép thông báo qua service worker; bỏ qua.
  }
}
