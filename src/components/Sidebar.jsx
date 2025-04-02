import React, { useEffect, useRef } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";

const Sidebar = ({ isAdmin = false, isOpen, toggleSidebar }) => {
  const router = useRouter();
  const sidebarRef = useRef(null);

  // Define separate color themes
  const sidebarBg = isAdmin ? "#002147" : "#2E7D32"; // Admin: Dark Navy Blue | Student: Deep Green
  const hoverColor = isAdmin ? "#004080" : "#388E3C"; // Admin: Richer Blue | Student: Refined Green
  const activeColor = isAdmin ? "#0055A4" : "#1B5E20"; // Admin: Darker Blue | Student: Darker Green

  const activeClass = `text-white font-semibold`;
  const baseClass = `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200`;

  const adminLinks = [
    { path: "/admin/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/admin/total-students", icon: <Users size={20} />, label: "Total Students" },
    { path: "/admin/exams", icon: <FileText size={20} />, label: "Exams" },
    { path: "/courses", icon: <BookOpen size={20} />, label: "Courses" },
    { path: "/admin/manage-notifications", icon: <Bell size={20} />, label: "Manage Notifications" },
    { path: "/admin/create", icon: <Plus size={20} />, label: "Create Exam" },
    { path: "/admin/support", icon: <MessageCircle size={20} />, label: "Support" },
  ];

  const studentLinks = [
    { path: "/student/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/exams/completed", icon: <ClipboardList size={20} />, label: "Completed Exams" },
    { path: "/exams/exams", icon: <Calendar size={20} />, label: "Exams" },
    { path: "/student/results", icon: <FileText size={20} />, label: "Results" },
    { path: "/certificates", icon: <Award size={20} />, label: "Certificates" },
    { path: "/contact-support", icon: <MessageCircle size={20} />, label: "Contact Support" },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  // Close sidebar automatically when the route changes
  useEffect(() => {
    const handleRouteChange = () => {
      toggleSidebar();
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router, toggleSidebar]);

  return (
    <motion.div
      ref={sidebarRef}
      className="fixed top-0 left-0 h-full w-64 text-white p-4 z-50"
      style={{ backgroundColor: sidebarBg }}
      initial={{ x: "-100%" }}
      animate={{ x: isOpen ? 0 : "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Close Button */}
      <button onClick={toggleSidebar} className="absolute top-4 right-4 text-white">
        <X size={24} />
      </button>

      <div className="flex items-center gap-3 mb-8 px-4">
        <GraduationCap size={32} />
        <h1 className="text-xl font-bold">Exam</h1>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map((link) => (
          <Link key={link.path} href={link.path}>
            <motion.div
              className={`${baseClass} ${router.pathname === link.path ? activeClass : ""}`}
              style={{
                backgroundColor: router.pathname === link.path ? activeColor : "transparent",
              }}
              whileHover={{ backgroundColor: hoverColor }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSidebar} // Auto-close sidebar when clicking a link
            >
              {link.icon}
              <span>{link.label}</span>
            </motion.div>
          </Link>
        ))}
      </nav>
    </motion.div>
  );
};

export default Sidebar;
