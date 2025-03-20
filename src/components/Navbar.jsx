//src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { account, databases } from "../utils/appwrite";
import { Query } from "appwrite";

const Navbar = ({ isAdmin = false, toggleSidebar }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      account.get().then((res) => setUser(res)).catch(() => router.push("/login"));
    } else {
      const studentSession = localStorage.getItem("studentSession");
      if (studentSession) {
        setUser(JSON.parse(studentSession));
      }
    }
  }, [isAdmin, router]);

  // Fetch Notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const collectionId = isAdmin
        ? process.env.NEXT_PUBLIC_APPWRITE_ADMIN_NOTIFICATIONS_COLLECTION_ID
        : process.env.NEXT_PUBLIC_APPWRITE_STUDENT_NOTIFICATIONS_COLLECTION_ID;

      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        collectionId,
        [Query.orderDesc("$createdAt")] // Latest first
      );
      setNotifications(response.documents);
    } catch (error) {
      console.error("Failed to load notifications:", error.message);
    }
    setLoadingNotifications(false);
  };

  const handleNotificationClick = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
      fetchNotifications(); // Load notifications when dropdown opens
    }
  };

  const handleLogout = async () => {
    if (isAdmin) {
      await account.deleteSession("current"); // ✅ Admin logout
    }
    localStorage.removeItem("studentSession"); // ✅ Student logout
    router.push("/login");
  };

  return (
    <div className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10">
      {/* Sidebar Toggle Button */}
      <button onClick={toggleSidebar} className="text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-gray-300">
        <Menu size={24} />
      </button>

      {/* Notifications & User Info */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Button */}
        <button
          className="relative p-2 rounded-full hover:bg-gray-100"
          onClick={handleNotificationClick}
        >
          <Bell size={20} className="text-gray-600" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isNotifOpen && (
          <div className="absolute right-10 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b bg-gray-100 font-medium">Notifications</div>
            <div className="p-3 max-h-60 overflow-y-auto">
              {loadingNotifications ? (
                <p className="text-gray-500 text-sm">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p className="text-gray-500 text-sm">No new notifications</p>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.$id} className="p-2 border-b last:border-none hover:bg-gray-100 rounded">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.content}</p>
                    <p className="text-xs text-gray-400">{new Date(notif.$createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User Info with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user ? user.name : "Guest"}</p>
              <p className="text-xs text-gray-500">{isAdmin ? "Administrator" : "Student"}</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
              <User size={20} />
            </div>
          </button>

          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
