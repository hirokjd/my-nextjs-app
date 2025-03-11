import React, { useState } from "react";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";

const Navbar = ({ isAdmin = false, toggleSidebar }) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleNotificationClick = () => {
    router.push(isAdmin ? "/admin/manage-notifications" : "/student/notifications");
  };

  const handleLogout = () => {
    router.push("/login");
    setIsDropdownOpen(false);
  };

  return (
    <div className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10">
      {/* Sidebar Toggle Button */}
      <button onClick={toggleSidebar} className="text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-gray-300">
        <Menu size={24} />
      </button>

      {/* Notifications & User Info */}
      <div className="flex items-center gap-4">
        {/* Notification Button */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 rounded-full hover:bg-gray-100"
        >
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {/* User Info with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {isAdmin ? "Krishna" : "Arjun"}
              </p>
              <p className="text-xs text-gray-500">
                {isAdmin ? "Administrator" : "Student"}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isAdmin ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
            }`}>
              <User size={20} />
            </div>
          </button>

          {/* Dropdown Menu */}
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

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default Navbar;