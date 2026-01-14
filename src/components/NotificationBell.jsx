import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Calendar, User, ChevronRight } from 'lucide-react';
import axiosInstance from '../axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAccounts, setIsAccounts] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/leave/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
      setIsAccounts(res.data.isAccounts || false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.put(`/leave/notifications/${notificationId}/read`);
      // Update locally without refetching
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await axiosInstance.put('/leave/notifications/read-all');
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approved':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-600" />;
      case 'submitted':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'submitted':
        return 'bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'submitted':
        return 'Submitted';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Notification';
    }
  };

  const handleNotificationClick = (notification) => {
    setIsOpen(false);
    // Navigate to leave management page with focus on the specific application
    navigate('/leave-management');
    // You could add logic to highlight the specific leave application
  };

  // Filter notifications - show all for accounts, only own for others
  const displayNotifications = isAccounts 
    ? notifications 
    : notifications.filter(n => n.userId && n.userId.toString() === localStorage.getItem('userId'));

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-blue-600 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors border border-gray-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-86 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Leave Notifications {isAccounts && '(All Users)'}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/leave-management')}
                    className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                  >
                    Manage <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading notifications...
                </div>
              ) : displayNotifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No leave notifications</p>
                </div>
              ) : (
                displayNotifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${getNotificationColor(
                      notification.type
                    )} ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        {/* Show user info for accounts role */}
                        {isAccounts && notification.userName && (
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {notification.userName}
                              {notification.userDesignation && ` • ${notification.userDesignation}`}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                              {new Date(notification.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              notification.type === 'approved' ? 'bg-green-100 text-green-800' :
                              notification.type === 'rejected' ? 'bg-red-100 text-red-800' :
                              notification.type === 'submitted' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getNotificationTypeLabel(notification.type)}
                            </span>
                            
                            {!notification.read && (
                              <button
                                onClick={(e) => markAsRead(notification._id, e)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Show leave dates */}
                        {notification.leaveDates && (
                          <div className="mt-1 text-xs text-gray-600">
                            📅 {notification.leaveDates}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {displayNotifications.length > 10 && (
                <div className="p-3 text-center border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/leave-management');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {displayNotifications.length} notifications →
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {unreadCount} unread • {displayNotifications.length} total
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;