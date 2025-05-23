import "../styles/globals.css";
import { useRouter } from "next/router";
import AdminLayout from "../components/AdminLayout";
import StudentLayout from "../components/StudentLayout";
import Navbar from "../components/Navbar";
import { useState } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdminRoute = router.pathname.startsWith("/admin");
  const isStudentRoute = router.pathname.startsWith("/student");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isAdminRoute) {
    return (
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar isAdmin={true} toggleSidebar={toggleSidebar} />
          <div className="flex flex-1 pt-16"> {/* Added pt-16 to account for navbar */}
            <AdminLayout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
              <Component {...pageProps} />
            </AdminLayout>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (isStudentRoute) {
    return (
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar isAdmin={false} toggleSidebar={toggleSidebar} />
          <div className="flex flex-1 pt-16"> {/* Added pt-16 to account for navbar */}
            <StudentLayout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
              <Component {...pageProps} />
            </StudentLayout>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;