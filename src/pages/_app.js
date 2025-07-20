import "../styles/globals.css";
import { useRouter } from "next/router";
import AdminLayout from "../components/AdminLayout";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../hooks/useAuth";
import { useState, useCallback, useMemo } from "react";
import StudentHeader from "../components/StudentHeader";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdminRoute = router.pathname.startsWith("/admin");
  const isStudentRoute = router.pathname.startsWith("/student");
  const isPublicRoute = !isAdminRoute && !isStudentRoute;

  // Optimized toggle function with useCallback
  const toggleSidebar = useCallback(() => {
    console.log('Toggle sidebar clicked, current state:', sidebarOpen);
    setSidebarOpen(prev => !prev);
  }, [sidebarOpen]);

  // Memoize layout components to prevent unnecessary re-renders
  const adminLayout = useMemo(() => (
    <>
        <Navbar isAdmin={true} toggleSidebar={toggleSidebar} />
          <AdminLayout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
            <Component {...pageProps} />
          </AdminLayout>
    </>
  ), [sidebarOpen, toggleSidebar, Component, pageProps]);

  // Minimal student layout: just Navbar and Component
  const studentLayout = useMemo(() => (
    <>
      <StudentHeader />
      <Component {...pageProps} />
    </>
  ), [Component, pageProps]);

    return (
    <AuthProvider>
      {isAdminRoute && adminLayout}
      {isStudentRoute && studentLayout}
      {isPublicRoute && <Component {...pageProps} />}
    </AuthProvider>
    );
}

export default MyApp;