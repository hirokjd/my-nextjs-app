import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/globals.css";
import { useRouter } from "next/router";

// Generic Layout Component
const Layout = ({ children, isAdmin }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={isAdmin} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1">
        <Navbar isAdmin={isAdmin} toggleSidebar={toggleSidebar} />
        <div className="pt-16">{children}</div>
      </div>
    </div>
  );
};

// Default Layout (for non-admin and non-student pages)
const DefaultLayout = ({ children }) => {
  return (
    <div>
      <Navbar isAdmin={false} toggleSidebar={() => {}} />
      <div className="pt-16">{children}</div>
    </div>
  );
};

// The App component that handles global layout
function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Determine the layout based on the route
  const isAdminRoute = router.pathname.startsWith("/admin");
  const isStudentRoute = router.pathname.startsWith("/student");
  const isExamsRoute = router.pathname.startsWith("/exams");
  const isRootRoute = router.pathname === "/";

  // Use the appropriate layout
  if (isAdminRoute) {
    return (
      <Layout isAdmin={true}>
        <Component {...pageProps} />
      </Layout>
    );
  }

  if (isStudentRoute || isExamsRoute || isRootRoute) {
    return (
      <Layout isAdmin={false}>
        <Component {...pageProps} />
      </Layout>
    );
  }

  // Use DefaultLayout for other pages (e.g., login, certificates, etc.)
  return (
    <DefaultLayout>
      <Component {...pageProps} />
    </DefaultLayout>
  );
}

export default MyApp;