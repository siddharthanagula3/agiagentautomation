import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useRealtime } from '../hooks/useRealtime';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
}

interface RealtimeNotificationProps {
  className?: string;
}

const RealtimeNotification: React.FC<RealtimeNotificationProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const { isConnected } = useRealtime({
    onNotification: (notification) => {
      const newNotification: Notification = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        timestamp: new Date(notification.created_at),
        isRead: notification.is_read || false
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
      setIsOpen(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 5000);
    },
    onError: (error) => {
      console.error('Real-time error:', error);
    }
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  return (
    <div className={cn("fixed top-4 right-4 z-50", className)}>
      <AnimatePresence>
        {isOpen && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-2"
          >
            {notifications.slice(0, 3).map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "max-w-sm p-4 rounded-lg border shadow-lg",
                  getNotificationStyles(notification.type)
                )}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold">
                      {notification.title}
                    </h4>
                    <p className="text-sm mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs mt-2 opacity-75">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 hover:bg-black/10 rounded"
                      title="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 hover:bg-black/10 rounded"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium",
            isConnected 
              ? "bg-green-100 text-green-800 border border-green-200" 
              : "bg-red-100 text-red-800 border border-red-200"
          )}
        >
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span>
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default RealtimeNotification;
