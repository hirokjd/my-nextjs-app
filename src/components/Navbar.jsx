import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Bell, User, ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { account, databases } from "../utils/appwrite";
import { Query } from "appwrite";
import Head from "next/head";

const Navbar = ({ isAdmin = false }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Fetch user data
  useEffect(() => {
    if (isAdmin) {
      account.get().then((res) => setUser(res)).catch(() => router.push("/login"));
    } else {
      const studentSession = localStorage.getItem("studentSession");
      if (studentSession) setUser(JSON.parse(studentSession));
    }
  }, [isAdmin, router]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isDropdownOpen && !e.target.closest(".user-dropdown")) setIsDropdownOpen(false);
      if (isNotifOpen && !e.target.closest(".notification-dropdown")) setIsNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, isNotifOpen]);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const collectionId = isAdmin
        ? process.env.NEXT_PUBLIC_APPWRITE_ADMIN_NOTIFICATIONS_COLLECTION_ID
        : process.env.NEXT_PUBLIC_APPWRITE_STUDENT_NOTIFICATIONS_COLLECTION_ID;
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        collectionId,
        [Query.orderDesc("$createdAt")]
      );
      setNotifications(response.documents);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
    setLoadingNotifications(false);
  };

  const handleNotificationClick = () => {
    if (!isNotifOpen) fetchNotifications();
    setIsNotifOpen(!isNotifOpen);
  };

  const handleLogout = async () => {
    if (isAdmin) await account.deleteSession("current");
    localStorage.removeItem("studentSession");
    router.push("/login");
  };

  return (
    <>
      <Head>
        <title>Online Exam Portal - Nielit Tezpur EC</title>
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      {/* Premium Light Navbar */}
      <nav className="fixed top-0 w-full h-16 bg-[#f8fafc] border-b border-[#e2e8f0] px-6 flex items-center justify-between z-50">
        {/* Logo & Title */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img 
            src="https://mimitmalout.ac.in/NIELIT.png" 
            alt="Logo"
            className="h-8 w-8"
          />
          <span className="text-lg font-semibold text-[#1e293b] hidden sm:inline">
            Online Exam Portal - Nielit Tezpur EC
          </span>
        </motion.div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <motion.div 
            className="relative notification-dropdown"
            whileHover={{ scale: 1.05 }}
          >
            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-full hover:bg-[#f1f5f9] transition-colors"
            >
              <Bell size={20} className="text-[#475569]" />
              {notifications.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"
                />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-md border border-[#e2e8f0] z-50"
                >
                  <div className="p-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
                    <h3 className="font-medium text-[#1e293b]">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-[#64748b] text-sm">
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-[#64748b] text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.$id} className="p-3 border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                          <p className="font-medium text-[#1e293b] text-sm">{notif.title}</p>
                          <p className="text-[#475569] text-xs mt-1">{notif.content}</p>
                          <p className="text-[#94a3b8] text-xs mt-1">
                            {new Date(notif.$createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* User Dropdown */}
          <motion.div className="relative user-dropdown">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 hover:bg-[#f1f5f9] rounded-full p-1 pr-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#e0f2fe] flex items-center justify-center">
                <User size={16} className="text-[#0369a1]" />
              </div>
              <ChevronDown 
                size={16} 
                className={`text-[#64748b] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-md border border-[#e2e8f0] z-50 py-1"
                >
                  <div className="px-4 py-2 border-b border-[#e2e8f0]">
                    <p className="font-medium text-[#1e293b] text-sm">{user?.name || "Guest"}</p>
                    <p className="text-[#64748b] text-xs">{isAdmin ? "Admin" : "Student"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[#475569] hover:bg-[#f8fafc] flex items-center space-x-2"
                  >
                    <LogOut size={14} />
                    <span>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;