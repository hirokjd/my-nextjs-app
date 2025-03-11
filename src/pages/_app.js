import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/globals.css";
import { useRouter } from "next/router";

// Admin Layout Component
const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={true} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1">
        <Navbar isAdmin={true} toggleSidebar={toggleSidebar} />
        <div className="pt-16">{children}</div>
      </div>
    </div>
  );
};

// Student Layout Component
const StudentLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={false} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1">
        <Navbar isAdmin={false} toggleSidebar={toggleSidebar} />
        <div className="pt-16">{children}</div>
      </div>
    </div>
  );
};

// The App component that handles global layout
function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Determine if the page is an Admin or Student route
  const isAdminRoute = router.pathname.startsWith("/admin");
  const isStudentRoute = router.pathname.startsWith("/student");

  // Admin Layout
  if (isAdminRoute) {
    return (
      <AdminLayout>
        <Component {...pageProps} />
      </AdminLayout>
    );
  }

  // Student Layout
  if (isStudentRoute) {
    return (
      <StudentLayout>
        <Component {...pageProps} />
      </StudentLayout>
    );
  }

  // For other pages (like login, certificates, etc.), just render the component directly
  return <Component {...pageProps} />;
}

export default MyApp;
