import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  PenSquare, 
  BarChart3, 
  Bell, 
  Settings, 
  ClipboardList,
  ChevronRight
} from "lucide-react";

const AdminLayout = ({ children, sidebarOpen, toggleSidebar }) => {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { name: "Manage Students", path: "/admin/students", icon: <Users size={18} /> },
    { name: "Manage Exams", path: "/admin/exams", icon: <FileText size={18} /> },
    { name: "Exam Enrollments", path: "/admin/exam-enrollments", icon: <ClipboardList size={18} /> },
    { name: "Manage Questions", path: "/admin/questions", icon: <PenSquare size={18} /> },
    { name: "Results & Analytics", path: "/admin/results", icon: <BarChart3 size={18} /> },
    { name: "Manage Notifications", path: "/admin/notifications", icon: <Bell size={18} /> },
    { name: "Settings", path: "/admin/settings", icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Modern sidebar with glass effect */}
      <aside 
        className={`w-64 bg-background/95 backdrop-blur-sm fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out border-r border-border/60 ${
          sidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full"
        } md:translate-x-0 md:shadow-none`}
      >
        <div className="p-4 md:p-5 h-full overflow-y-auto">
          <div className="mb-6 pb-4 border-b border-border/60">
            <h2 className="px-3 text-xl font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Admin Portal
            </h2>
          </div>
          
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  shallow={true}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-primary/10 text-primary-dark font-medium" 
                      : "text-muted hover:bg-muted-light/70 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${isActive ? "text-primary" : "text-muted"} transition-colors duration-200`}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <ChevronRight size={16} className="text-primary opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-8 pt-4 border-t border-border/60">
            <div className="px-3 py-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary-light/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <LayoutDashboard size={18} className="text-primary" />
                </div>
                <h3 className="font-medium text-foreground">Admin Portal</h3>
              </div>
              <p className="text-xs text-muted">Manage your exams, students, and view analytics from one dashboard.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content - Adjusted for fixed sidebar */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "ml-0" : "ml-0"
      } md:ml-64`}>
        <div className="p-4 sm:p-6 min-h-[calc(100vh-4rem)] dashboard-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminLayout;