import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Bell, User, ChevronDown, LogOut, Menu, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { account, databases } from "../utils/appwrite";
import { Query } from "appwrite";
import Head from "next/head";
import dashboardCache, { CACHE_KEYS } from "../utils/cache";
import performanceMonitor, { PERFORMANCE_OPS } from "../utils/performance";

const Navbar = ({ isAdmin = false, toggleSidebar }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  // Debug logging
  console.log('Navbar props:', { isAdmin, toggleSidebar: typeof toggleSidebar });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize user data fetching
  const fetchUserData = useCallback(async () => {
    try {
    if (isAdmin) {
        const userData = await account.get();
        setUser(userData);
    } else {
      const studentSession = localStorage.getItem("studentSession");
        if (studentSession) {
          setUser(JSON.parse(studentSession));
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (isAdmin) {
        router.push("/login");
      }
    }
  }, [isAdmin, router]);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isDropdownOpen && !e.target.closest(".user-dropdown")) {
        setIsDropdownOpen(false);
      }
      if (isNotifOpen && !e.target.closest(".notification-dropdown")) {
        setIsNotifOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isNotifOpen]);

  // Optimized notification fetching with caching
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    performanceMonitor.startTimer(PERFORMANCE_OPS.DATA_FETCH);
    
    try {
      // Check cache first
      const cacheKey = isAdmin ? 'admin_notifications' : 'student_notifications';
      const cachedNotifications = dashboardCache.get(cacheKey);
      
      if (cachedNotifications) {
        setNotifications(cachedNotifications);
        setLoadingNotifications(false);
        return;
      }

      const collectionId = isAdmin
        ? process.env.NEXT_PUBLIC_APPWRITE_ADMIN_NOTIFICATIONS_COLLECTION_ID
        : process.env.NEXT_PUBLIC_APPWRITE_STUDENT_NOTIFICATIONS_COLLECTION_ID;
      
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        collectionId,
        [Query.orderDesc("$createdAt"), Query.limit(10)] // Limit to 10 notifications
      );
      
      // Cache notifications for 2 minutes
      dashboardCache.set(cacheKey, response.documents, 2 * 60 * 1000);
      setNotifications(response.documents);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
    setLoadingNotifications(false);
      performanceMonitor.endTimer(PERFORMANCE_OPS.DATA_FETCH);
    }
  }, [isAdmin]);

  const handleNotificationClick = useCallback(() => {
    if (!isNotifOpen) {
      fetchNotifications();
    }
    setIsNotifOpen(!isNotifOpen);
  }, [isNotifOpen, fetchNotifications]);

  const handleLogout = useCallback(async () => {
    try {
      if (isAdmin) {
        await account.deleteSession("current");
      }
    localStorage.removeItem("studentSession");
      dashboardCache.clear(); // Clear cache on logout
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    router.push("/login");
    }
  }, [isAdmin, router]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Clear cache and refetch data
      dashboardCache.clear();
      await fetchUserData();
      if (isNotifOpen) {
        await fetchNotifications();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserData, fetchNotifications, isNotifOpen]);

  // Memoize notification count
  const notificationCount = useMemo(() => {
    return notifications.filter(notif => !notif.read).length;
  }, [notifications]);

  // Memoize formatted notifications
  const formattedNotifications = useMemo(() => {
    return notifications.map(notif => ({
      ...notif,
      formattedTime: new Date(notif.$createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [notifications]);

  return (
    <>
      <Head>
        <title>Online Exam Portal - Nielit Tezpur EC</title>
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      {/* Enhanced Premium Light Navbar */}
      <nav className="fixed top-0 w-full h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between z-50 shadow-sm">
        {/* Left Side - Logo & Menu */}
        <div className="flex items-center space-x-4">
          {/* Menu Button - Visible on all screen sizes */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            title="Toggle sidebar"
          >
            <Menu size={20} className="text-gray-600" />
          </button>

        {/* Logo & Title */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform duration-150"
          onClick={() => router.push("/")}
        >
          <img 
            src="https://mimitmalout.ac.in/NIELIT.png" 
            alt="Logo"
            className="h-8 w-8"
              loading="lazy"
          />
            <span className="text-lg font-semibold text-gray-800 hidden sm:inline">
            Online Exam Portal - Nielit Tezpur EC
          </span>
        </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Refresh Button */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Refresh data"
          >
            <RefreshCw 
              size={18} 
              className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </motion.button>

          {/* Notification Bell */}
          <motion.div 
            className="relative notification-dropdown"
            whileHover={{ scale: 1.05 }}
          >
            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              title="Notifications"
            >
              <Bell size={20} className="text-gray-600" />
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.span>
              )}
            </button>

            {/* Enhanced Notification Dropdown */}
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      {notificationCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {notificationCount} new
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Loading notifications...</p>
                      </div>
                    ) : formattedNotifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No notifications</p>
                      </div>
                    ) : (
                      formattedNotifications.map((notif, index) => (
                        <motion.div
                          key={notif.$id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm mb-1">{notif.title}</p>
                              <p className="text-gray-600 text-xs leading-relaxed">{notif.content}</p>
                              <p className="text-gray-400 text-xs mt-2">{notif.formattedTime}</p>
                            </div>
                        </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enhanced User Dropdown */}
          <motion.div className="relative user-dropdown">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.name || "Guest"}
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <p className="font-semibold text-gray-800">{user?.name || "Guest"}</p>
                    <p className="text-gray-500 text-sm">{user?.email || ""}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {isAdmin ? "Administrator" : "Student"}
                    </span>
                  </div>
                  <div className="p-2">
                  <button
                    onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center space-x-2"
                  >
                      <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </nav>
    </>
  );
};

export default React.memo(Navbar);