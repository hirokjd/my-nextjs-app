import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const StudentLayout = ({ children, sidebarOpen, toggleSidebar }) => {
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/student/' },
    { name: 'Exams', path: '/student/exams' },
    { name: 'Results', path: '/student/results' },
    // { name: 'Certificates', path: '/student/certificates' },
    // { name: 'Notifications', path: '/student/notifications' },
    // { name: 'Contact Support', path: '/student/contact-support' },
  ];

  return (
    <>
      <Head>
        <title>Student Portal</title>
        <meta name="description" content="Student examination portal" />
      </Head>

      {/* Sidebar with professional slate blue color */}
      <aside className={`w-64 bg-slate-700 text-white fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}>
        <div className="p-4 md:p-6 h-full overflow-y-auto">
          <h2 className="text-xl font-bold mb-6">Student Portal</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                shallow={true}
                className={`block py-2 px-4 rounded transition-colors duration-200 ${
                  router.pathname === item.path
                    ? 'bg-slate-100 text-slate-800 font-semibold'
                    : 'text-slate-200 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content - Unchanged except for color adjustment */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? "ml-64" : "ml-0"
      } md:ml-64`}>
        <div className="p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
          <div className="container mx-auto">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};

export default StudentLayout;