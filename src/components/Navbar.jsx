import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Bell, User, ChevronDown, LogOut, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { account, databases } from "../utils/appwrite";
import { Query } from "appwrite";
import Head from "next/head";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ isAdmin = false, toggleSidebar }) => {
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
        <title>Online Exam Portal</title>
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      {/* Enhanced Modern Navbar */}
      <nav className="fixed top-0 w-full h-16 bg-background/80 backdrop-blur-md border-b border-border/60 px-4 sm:px-6 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Menu Toggle (Mobile) */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-foreground hover:bg-muted-light hover:text-primary transition-all duration-200"
          >
            <Menu size={20} />
          </button>

          {/* Logo & Title */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 p-1.5">
              <img 
                src="https://mimitmalout.ac.in/NIELIT.png" 
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-primary via-primary-light to-accent bg-clip-text text-transparent hidden sm:inline-block">
              Online Exam Portal
            </span>
          </motion.div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <motion.div 
            className="relative notification-dropdown"
            whileHover={{ scale: 1.05 }}
          >
            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-lg bg-muted-light/30 hover:bg-muted-light/70 transition-all duration-200 relative"
            >
              <Bell size={18} className="text-foreground" />
              {notifications.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 10 }}
                  className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-background"
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
                  className="absolute right-0 top-12 w-80 bg-card rounded-lg shadow-lg border border-border z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-border bg-muted-light/30">
                    <h3 className="font-medium text-foreground">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-muted text-sm">
                        <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted text-sm">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted-light/50 flex items-center justify-center">
                          <Bell size={20} className="text-muted" />
                        </div>
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.$id} className="p-3 border-b border-border hover:bg-muted-light/30 transition-all duration-200">
                          <p className="font-medium text-foreground text-sm">{notif.title}</p>
                          <p className="text-muted text-xs mt-1">{notif.content}</p>
                          <p className="text-muted text-xs mt-1">
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

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Dropdown */}
          <motion.div className="relative user-dropdown">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 bg-muted-light/30 hover:bg-muted-light/70 rounded-lg py-2 px-3 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-light/80 flex items-center justify-center btn-text">
                <User size={15} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground line-clamp-1">{user?.name || "Guest"}</p>
                <p className="text-xs text-muted">{isAdmin ? "Admin" : "Student"}</p>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-12 w-56 bg-card rounded-lg shadow-lg border border-border z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <p className="font-medium text-foreground">{user?.name || "Guest"}</p>
                    <p className="text-muted text-xs mt-1">{isAdmin ? "Admin" : "Student"}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm rounded-md text-foreground hover:bg-danger/10 hover:text-danger flex items-center gap-3 transition-all duration-200"
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

export default Navbar;