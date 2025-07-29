import React, { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  FileCheck,
  HelpCircle,
  BarChart2,
  Bell,
  Settings,
  ChevronRight,
  Home,
  Activity,
  Shield,
  Monitor,
  UserCog,
  UserCheck, // Replaced ClipboardUser with UserCheck
} from "lucide-react";

const AdminLayout = ({ children, sidebarOpen, toggleSidebar }) => {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState(new Set(['main', 'operations']));
  const sidebarRef = useRef(null);

  // Memoize menu items for better performance
  const menuItems = useMemo(() => [
    {
      section: 'main',
      title: 'Main',
      items: [
        { name: "Dashboard", path: "/admin", icon: LayoutDashboard, description: "Overview and analytics" },
      ]
    },
    {
      section: 'management',
      title: 'Management',
      items: [
        { name: "Manage Courses", path: "/admin/courses", icon: BookOpen, description: "Course administration" },
        { name: "Manage Students", path: "/admin/students", icon: Users, description: "Student management" },
        { name: "Manage Examiners", path: "/admin/controller", icon: UserCog, description: "Examiner accounts" },
        { name: "Manage Exams", path: "/admin/exams", icon: FileText, description: "Exam configuration" },
        { name: "Manage Questions", path: "/admin/questions", icon: HelpCircle, description: "Question bank" },
      ]
    },
    {
      section: 'operations',
      title: 'Operations',
      items: [
        { name: "Live Monitoring", path: "/admin/monitoring", icon: Monitor, description: "Real-time student activity" },
        { name: "Exam Enrollments", path: "/admin/exam-enrollments", icon: FileCheck, description: "Student enrollments" },
        { name: "Exam Students", path: "/admin/exam-students", icon: UserCheck, description: "View and print enrolled students" }, // Changed icon to UserCheck
        { name: "Results & Analytics", path: "/admin/results", icon: BarChart2, description: "Performance analytics" },
        { name: "Manage Notifications", path: "/admin/notifications", icon: Bell, description: "System notifications" },
      ]
    },
    {
      section: 'system',
      title: 'System',
      items: [
        { name: "Settings", path: "/admin/settings", icon: Settings, description: "System configuration" },
      ]
    }
  ], []);

  // Optimized toggle section with useCallback
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Optimized active path check
  const isActivePath = useCallback((path) => {
    return router.pathname === path;
  }, [router.pathname]);

  // Get current section based on active path
  const currentSection = useMemo(() => {
    for (const section of menuItems) {
      if (section.items.some(item => isActivePath(item.path))) {
        return section.section;
      }
    }
    return 'main';
  }, [menuItems, isActivePath]);

  // Auto-expand current section
  React.useEffect(() => {
    if (!expandedSections.has(currentSection)) {
      setExpandedSections(prev => new Set([...prev, currentSection]));
    }
  }, [currentSection, expandedSections]);

  // Optimized navigation handler
  const handleNavigation = useCallback((path) => {
    // Pre-close sidebar on mobile for better UX
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    router.push(path);
  }, [router, toggleSidebar]);

  return (
    <>
      {/* Optimized Sidebar with simplified animations */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -256,
        }}
        transition={{
          type: "tween",
          duration: 0.2,
          ease: "easeInOut"
        }}
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 w-64 bg-white border-r border-gray-200 shadow-lg overflow-hidden"
        style={{ willChange: 'transform' }}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Admin Panel</h2>
                <p className="text-xs text-gray-500">Examination Management Console</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((section) => (
              <div key={section.section} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                >
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span>{section.title}</span>
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform duration-150 ${
                      expandedSections.has(section.section) ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Section Items with optimized animations */}
                <AnimatePresence>
                  {expandedSections.has(section.section) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                      className="space-y-1 ml-4"
                    >
                      {section.items.map((item) => (
                        <div key={item.path}>
                          <button
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 group ${
                              isActivePath(item.path)
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`flex-shrink-0 ${
                                isActivePath(item.path)
                                  ? "text-white"
                                  : "text-gray-400 group-hover:text-gray-600"
                              }`}>
                                <item.icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isActivePath(item.path) ? "text-white" : "text-gray-700"
                                }`}>
                                  {item.name}
                                </p>
                                <p className={`text-xs truncate ${
                                  isActivePath(item.path) ? "text-blue-100" : "text-gray-500"
                                }`}>
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <Activity size={14} />
              <span>System Status: Online</span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">All systems operational</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Optimized Main Content with CSS transforms */}
      <main
        className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-200 ease-in-out ${
          sidebarOpen
            ? "bg-gradient-to-br from-gray-50 to-gray-100"
            : "bg-white"
        }`}
        style={{
          marginLeft: sidebarOpen ? '256px' : '0',
          willChange: 'margin-left'
        }}
      >
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <Link href="/admin" className="hover:text-blue-600 transition-colors">
                    <Home size={14} className="inline mr-1" />
                    Admin
                  </Link>
                </li>
                <li>
                  <ChevronRight size={14} />
                </li>
                <li className="text-gray-700 font-medium">
                  {menuItems.flatMap(section => section.items).find(item => isActivePath(item.path))?.name || 'Dashboard'}
                </li>
              </ol>
            </nav>

            {/* Page Content */}
            <div>
              {children}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default React.memo(AdminLayout);