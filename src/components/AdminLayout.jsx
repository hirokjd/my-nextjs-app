import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const AdminLayout = ({ children, sidebarOpen, toggleSidebar }) => {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Manage Courses", path: "/admin/courses" },
    { name: "Manage Students", path: "/admin/students" },
    { name: "Manage Exams", path: "/admin/exams" },
    { name: "Exam Enrollments", path: "/admin/exam-enrollments" },
    { name: "Manage Questions", path: "/admin/questions" },
    { name: "Results & Analytics", path: "/admin/results" },
    { name: "Manage Notifications", path: "/admin/notifications" },
    { name: "Settings", path: "/admin/settings" },
  ];

  return (
    <>
      {/* Sidebar - Now fixed positioned */}
      <aside className={`w-64 bg-gray-800 text-white fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div className="p-4 md:p-6 h-full overflow-y-auto">
          <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                shallow={true}
                className={`block py-2 px-4 rounded transition-colors duration-200 ${
                  router.pathname === item.path 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "ml-64" : "ml-0"
      } md:ml-64`}>
        <div className="p-4 sm:p-6 bg-gray-100 min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminLayout;