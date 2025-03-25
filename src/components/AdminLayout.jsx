import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const AdminLayout = ({ children }) => {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "Manage Students", path: "/admin/students" },
    { name: "Manage Exams", path: "/admin/exams" },
    { name: "Manage Questions", path: "/admin/questions" },
    { name: "Results & Analytics", path: "/admin/results" },
    { name: "Manage Notifications", path: "/admin/notifications" },
    { name: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav>
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path} className={`block py-2 px-4 rounded ${router.pathname === item.path ? "bg-blue-500" : "hover:bg-gray-700"}`}>
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100 overflow-auto">{children}</main>
    </div>
  );
};

export default AdminLayout;
