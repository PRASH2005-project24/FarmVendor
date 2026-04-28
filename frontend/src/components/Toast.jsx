import { useState, useEffect } from 'react';
import API from '../api';
import { FiBell, FiX } from 'react-icons/fi';
import './Toast.css';

export default function Toast() {
  const [notification, setNotification] = useState(null);
  const [shownIds, setShownIds] = useState(new Set());

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await API.get('/notifications');
        const notifications = res.data;
        if (notifications.length > 0) {
          // Find the most recent unread notification
          const latestUnread = notifications.find(n => n.status === 'unread');
          if (latestUnread && !shownIds.has(latestUnread.notification_id)) {
            setNotification(latestUnread);
            setShownIds(prev => new Set(prev).add(latestUnread.notification_id));
            
            // Auto dismiss after 5 seconds
            setTimeout(() => {
              setNotification(prev => prev?.notification_id === latestUnread.notification_id ? null : prev);
            }, 5000);
          }
        }
      } catch (err) {
        // Ignore polling errors
      }
    };

    fetchLatest(); // Initial check
    const interval = setInterval(fetchLatest, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [shownIds]);

  if (!notification) return null;

  return (
    <div className="toast-container slide-in">
      <div className="toast-content">
        <div className="toast-icon">
          <FiBell />
        </div>
        <div className="toast-text">
          <strong>{notification.title || 'New Notification'}</strong>
          <p>{notification.message}</p>
        </div>
        <button className="toast-close" onClick={() => setNotification(null)}>
          <FiX />
        </button>
      </div>
    </div>
  );
}
