// Web Push Notifications utility
// Works on iOS 16.4+ (PWA only, must be added to home screen) and Android Chrome

const STORAGE_KEY = 'hlf_notif_permission';

export const notifications = {
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  async scheduleTaskReminder(task) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (!task.next_due_date) return;

    const dueDate = new Date(task.next_due_date);
    dueDate.setHours(9, 0, 0, 0); // 9am on due date

    const now = new Date();
    const msUntilDue = dueDate.getTime() - now.getTime();

    if (msUntilDue <= 0) return; // already past

    // Store reminder in localStorage — SW will check these on activation
    const reminders = JSON.parse(localStorage.getItem('hlf_reminders') || '[]');
    // Remove any existing reminder for this task
    const filtered = reminders.filter(r => r.taskId !== task.id);
    filtered.push({
      taskId: task.id,
      taskName: task.name,
      dueDate: dueDate.toISOString(),
      category: task.category || '',
    });
    localStorage.setItem('hlf_reminders', JSON.stringify(filtered));
  },

  // Show an immediate local notification (e.g. after completing a task)
  async show(title, body, options = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    const sw = await navigator.serviceWorker.ready;
    sw.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      ...options,
    });
  },
};