import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const AdminLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
