import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
} from "lucide-react";

const AdminLayout = ({ children, sidebarOpen, toggleSidebar }) => {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Manage Courses", path: "/admin/courses", icon: BookOpen },
    { name: "Manage Students", path: "/admin/students", icon: Users },
    { name: "Manage Exams", path: "/admin/exams", icon: FileText },
    { name: "Exam Enrollments", path: "/admin/exam-enrollments", icon: FileCheck },
    { name: "Manage Questions", path: "/admin/questions", icon: HelpCircle },
    { name: "Results & Analytics", path: "/admin/results", icon: BarChart2 },
    { name: "Manage Notifications", path: "/admin/notifications", icon: Bell },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <>
      {/* Sidebar - Fixed, light-themed */}
      <aside
        className={`w-64 bg-white text-gray-700 fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out border-r border-gray-200 shadow-sm ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-4 sm:p-6 h-full overflow-y-auto">
          <h2 className="text-xl font-extrabold text-gray-800 mb-6">Admin Panel</h2>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                shallow={true}
                className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors duration-200 text-base font-semibold ${
                  router.pathname === item.path
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon size={20} className="shrink-0" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content - Adjusted for fixed sidebar */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-64" : "ml-0"
        } md:ml-64`}
      >
        <div className="p-4 sm:p-6 bg-gray-100 min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto">{children}</div>
        </div>
      </main>
    </>
  );
};

export default AdminLayout;