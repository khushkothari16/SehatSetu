import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleNotificationUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('notification_received', handleNotificationUpdate);
    window.addEventListener('medicine_reminder_updated', handleNotificationUpdate);
    window.addEventListener('dose_taken_success', handleNotificationUpdate);
    window.addEventListener('storage', handleNotificationUpdate);

    return () => {
      window.removeEventListener('notification_received', handleNotificationUpdate);
      window.removeEventListener('medicine_reminder_updated', handleNotificationUpdate);
      window.removeEventListener('dose_taken_success', handleNotificationUpdate);
      window.removeEventListener('storage', handleNotificationUpdate);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
  };

  const addToast = (message, type = 'info') => {
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 4000);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        toasts,
        addToast,
        refreshNotifications: loadNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
