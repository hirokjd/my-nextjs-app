// path: src/components/Sidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Bell,
  MessageCircle,
  FileText,
  Calendar,
  Award,
  ClipboardList,
  BookOpen,
  X,
  Plus,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ isAdmin = false }) => {
  const router = useRouter();
  const sidebarRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Toggle sidebar
  const toggleSidebar = () => setIsOpen(!isOpen);

  // Define color themes
  const theme = {
    admin: {
      sidebarBg: "#1e293b", // slate-800
      hoverColor: "#334155", // slate-700
      activeColor: "#0f172a", // slate-900
      textColor: "text-white",
      brandColor: "#2563eb", // blue-600
    },
    student: {
      sidebarBg: "#166534", // green-800
      hoverColor: "#15803d", // green-700
      activeColor: "#14532d", // green-900
      textColor: "text-white",
      brandColor: "#22c55e", // green-500
    },
  };

  const currentTheme = isAdmin ? theme.admin : theme.student;

  const activeClass = `${currentTheme.textColor} font-semibold`;
  const baseClass = `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentTheme.textColor}`;

  const adminLinks = [
    { path: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/admin/students", icon: <Users size={20} />, label: "Manage Students" },
    { path: "/admin/exams", icon: <FileText size={20} />, label: "Manage Exams" },
    { path: "/admin/questions", icon: <BookOpen size={20} />, label: "Manage Questions" },
    { path: "/admin/results", icon: <ClipboardList size={20} />, label: "Results & Analytics" },
    { path: "/admin/notifications", icon: <Bell size={20} />, label: "Manage Notifications" },
    { path: "/admin/settings", icon: <MessageCircle size={20} />, label: "Settings" },
  ];

  const studentLinks = [
    { path: "/student/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/student/exams", icon: <Calendar size={20} />, label: "Exams" },
    { path: "/student/results", icon: <FileText size={20} />, label: "Results" },
    { path: "/student/certificates", icon: <Award size={20} />, label: "Certificates" },
    { path: "/student/notifications", icon: <Bell size={20} />, label: "Notifications" },
    { path: "/student/contact-support", icon: <MessageCircle size={20} />, label: "Contact Support" },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  // Close sidebar when clicking outside or changing route
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleRouteChange = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [isOpen, router]);

  return (
    <>
      {/* Mobile Header with Menu Button */}
      <div className="md:hidden p-4 flex justify-between items-center" style={{ backgroundColor: currentTheme.sidebarBg }}>
        <div className="flex items-center gap-2">
          <GraduationCap size={24} />
          <h2 className="text-lg font-bold text-white">
            {isAdmin ? "Admin Panel" : "Student Portal"}
          </h2>
        </div>
        <button 
          onClick={toggleSidebar}
          className="text-white focus:outline-none"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-40"
          >
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={toggleSidebar}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.aside
        ref={sidebarRef}
        className={`fixed md:relative top-0 left-0 h-full w-64 ${currentTheme.textColor} z-50`}
        style={{ backgroundColor: currentTheme.sidebarBg }}
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Close Button (mobile only) */}
        <button 
          onClick={toggleSidebar} 
          className="absolute top-4 right-4 md:hidden text-white"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>

        <div className="p-4 md:p-6 h-full flex flex-col">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap size={28} className="text-blue-400" />
            <h2 className="text-xl font-bold hidden md:block">
              {isAdmin ? "Admin Panel" : "Student Portal"}
            </h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {links.map((link) => (
              <Link key={link.path} href={link.path} passHref>
                <motion.div
                  className={`${baseClass} ${router.pathname === link.path ? activeClass : ""}`}
                  style={{
                    backgroundColor: router.pathname === link.path ? currentTheme.activeColor : "transparent",
                  }}
                  whileHover={{ 
                    backgroundColor: router.pathname === link.path ? currentTheme.activeColor : currentTheme.hoverColor 
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </motion.div>
              </Link>
            ))}
          </nav>

          {/* User Profile (optional) */}
          <div className="mt-auto pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-xs font-medium">U</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-gray-300">{isAdmin ? "Admin" : "Student"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

// Layout components that use the Sidebar
export const AdminLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <Sidebar isAdmin={true} />
      
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export const StudentLayout = ({ children }) => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar isAdmin={false} />
      
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;