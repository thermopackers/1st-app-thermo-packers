import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, User, MapPin, Eye, ChevronRight } from 'lucide-react';
import axiosInstance from '../axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';

const AttendanceNotification = () => {
  const { user: currentUser } = useUserContext();
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const navigate = useNavigate();

  // Helper function to parse user roles
  const parseUserRoles = (user) => {
    if (!user || !user.role) {
      return [];
    }
    
    let userRoles = [];
    if (Array.isArray(user.role)) {
      if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
        try {
          userRoles = JSON.parse(user.role[0]);
        } catch (parseError) {
          userRoles = user.role;
        }
      } else {
        userRoles = user.role;
      }
    } else if (typeof user.role === 'string') {
      try {
        userRoles = JSON.parse(user.role);
      } catch (parseError) {
        userRoles = [user.role];
      }
    } else {
      userRoles = [user.role];
    }
    return userRoles;
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fetch attendance logs
  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const today = getTodayDate();
      const token = localStorage.getItem("token");
      
      // Get user roles to determine if privileged
      const userRoles = currentUser ? parseUserRoles(currentUser) : [];
      const hasPrivilegedAccess = userRoles.some(role => ["admin", "accounts"].includes(role));
      setIsPrivileged(hasPrivilegedAccess);
      
      // Fetch attendance for today
      const res = await axiosInstance.get(`/attendance?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const logs = res.data.logs || [];
      setAttendanceLogs(logs);
      
      // Process logs to create recent activities
      const activities = processAttendanceActivities(logs, hasPrivilegedAccess, currentUser?._id);
      setRecentActivities(activities);
      
      // Calculate unread count (show count for privileged users, 0 for others)
      const count = hasPrivilegedAccess ? activities.filter(a => !a.read && a.isRecent).length : 0;
      setUnreadCount(count);
      
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process attendance logs into notification activities
  const processAttendanceActivities = (logs, isPrivileged, currentUserId) => {
    const activities = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    logs.forEach(log => {
      const user = log.user;
      const isCurrentUser = user?._id === currentUserId || user?.toString() === currentUserId;
      
      // Process check-in if available and recent
      if (log.checkIn && log.checkIn.time) {
        const checkInTime = new Date(log.checkIn.time);
        const isRecent = checkInTime > oneHourAgo;
        
        activities.push({
          id: `checkin-${log.checkIn._id || Date.now()}`,
          type: 'checkin',
          user: user,
          time: checkInTime,
          photo: log.checkIn.photo,
          location: log.checkIn.location,
          message: `${isCurrentUser ? 'You' : (user?.name || 'Employee')} checked in`,
          isRecent: isRecent,
          read: false,
          isCurrentUser: isCurrentUser
        });
      }
      
      // Process check-out if available and recent
      if (log.checkOut && log.checkOut.time) {
        const checkOutTime = new Date(log.checkOut.time);
        const isRecent = checkOutTime > oneHourAgo;
        
        activities.push({
          id: `checkout-${log.checkOut._id || Date.now()}`,
          type: 'checkout',
          user: user,
          time: checkOutTime,
          photo: log.checkOut.photo,
          location: log.checkOut.location,
          message: `${isCurrentUser ? 'You' : (user?.name || 'Employee')} checked out`,
          isRecent: isRecent,
          read: false,
          isCurrentUser: isCurrentUser
        });
      }
      
      // Check for missing check-out (if checked in but not checked out by 6 PM)
      if (log.checkIn && !log.checkOut) {
        const checkOutTime = new Date();
        checkOutTime.setHours(18, 0, 0, 0); // 6 PM
        
        if (now > checkOutTime) {
          activities.push({
            id: `missing-checkout-${log.checkIn._id || Date.now()}`,
            type: 'missing_checkout',
            user: user,
            time: now,
            message: `${isCurrentUser ? 'You haven\'t' : (user?.name || 'Employee') + ' hasn\'t'} checked out yet`,
            isRecent: true,
            read: false,
            isCurrentUser: isCurrentUser
          });
        }
      }
    });
    
    // Sort by time (newest first)
    return activities.sort((a, b) => b.time - a.time);
  };

  useEffect(() => {
    if (currentUser) {
      fetchAttendanceLogs();
      
      // Refresh every 2 minutes
      const interval = setInterval(fetchAttendanceLogs, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Mark activity as read
  const markAsRead = (activityId, e) => {
    if (e) e.stopPropagation();
    setRecentActivities(prev => 
      prev.map(a => a.id === activityId ? { ...a, read: true } : a)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = (e) => {
    if (e) e.stopPropagation();
    setRecentActivities(prev => prev.map(a => ({ ...a, read: true })));
    setUnreadCount(0);
  };

  // Get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case 'checkin':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'checkout':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'missing_checkout':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get activity color
  const getActivityColor = (type) => {
    switch (type) {
      case 'checkin':
        return 'bg-green-50 border-green-200';
      case 'checkout':
        return 'bg-red-50 border-red-200';
      case 'missing_checkout':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle view photo
  const handleViewPhoto = (photoUrl, e) => {
    e.stopPropagation();
    if (photoUrl) {
      window.open(photoUrl, '_blank');
    }
  };

  // Handle view location
  const handleViewLocation = (location, e) => {
    e.stopPropagation();
    if (location?.lat && location?.lng) {
      window.open(
        `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        '_blank'
      );
    }
  };

  // Handle activity click
  const handleActivityClick = (activity) => {
    setIsOpen(false);
    if (activity.type === 'missing_checkout' && activity.isCurrentUser) {
      navigate('/attendance');
    } else {
      navigate('/attendance-logs');
    }
  };

  // Filter activities to show
  const displayActivities = isPrivileged 
    ? recentActivities 
    : recentActivities.filter(a => a.isCurrentUser);

  return (
    <div className="relative">
      {/* Attendance Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-green-600 cursor-pointer hover:bg-green-50 rounded-lg transition-colors border border-gray-300"
      >
        <Clock className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-86 bg-white rounded-lg shadow-lg border border-gray-200 z-5 max-h-96 overflow-hidden"          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Attendance {isPrivileged ? '(All Users)' : '(Your Activity)'}
                  <span className="text-xs text-gray-500 font-normal">
                    • Today: {getTodayDate()}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/attendance-logs')}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                  Loading attendance...
                </div>
              ) : displayActivities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No recent attendance activity</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {isPrivileged ? 'No employees have marked attendance yet' : 'You haven\'t marked attendance today'}
                  </p>
                </div>
              ) : (
                displayActivities.slice(0, 8).map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${getActivityColor(
                      activity.type
                    )} ${!activity.read && activity.isRecent ? 'border-l-4 border-l-green-500' : ''}`}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        {/* User info for privileged users */}
                        {isPrivileged && activity.user?.name && (
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {activity.user.name}
                              {activity.user.role && ` • ${activity.user.role}`}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatTime(activity.time)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              activity.type === 'checkin' ? 'bg-green-100 text-green-800' :
                              activity.type === 'checkout' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.type === 'checkin' ? 'Check-in' : 
                               activity.type === 'checkout' ? 'Check-out' : 'Reminder'}
                            </span>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {activity.photo && (
                                <button
                                  onClick={(e) => handleViewPhoto(activity.photo, e)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View Photo"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                              )}
                              
                              {activity.location && (
                                <button
                                  onClick={(e) => handleViewLocation(activity.location, e)}
                                  className="text-green-600 hover:text-green-800"
                                  title="View Location"
                                >
                                  <MapPin className="w-3 h-3" />
                                </button>
                              )}
                              
                              {!activity.read && activity.isRecent && (
                                <button
                                  onClick={(e) => markAsRead(activity.id, e)}
                                  className="text-green-600 hover:text-green-800 text-xs"
                                  title="Mark as read"
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Current user status */}
                        {activity.type === 'missing_checkout' && activity.isCurrentUser && (
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/attendance');
                              }}
                              className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                            >
                              Mark Check-out Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Summary section */}
              {displayActivities.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">
                        {displayActivities.filter(a => a.type === 'checkin').length}
                      </div>
                      <div className="text-gray-500">Check-ins</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">
                        {displayActivities.filter(a => a.type === 'checkout').length}
                      </div>
                      <div className="text-gray-500">Check-outs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-700">
                        {attendanceLogs.filter(log => log.checkIn && !log.checkOut).length}
                      </div>
                      <div className="text-gray-500">Active</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {unreadCount} unread • {displayActivities.length} activities
                  {isPrivileged && ` • ${attendanceLogs.length} employees`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/attendance')}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceNotification;