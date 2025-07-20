import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DebugSidebar = () => {
  const [sidebarState, setSidebarState] = useState('Unknown');

  useEffect(() => {
    // Try to detect sidebar state from DOM
    const checkSidebar = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const transform = window.getComputedStyle(sidebar).transform;
        const isVisible = transform === 'none' || transform.includes('translateX(0px)');
        setSidebarState(isVisible ? 'Visible' : 'Hidden');
      }
    };

    checkSidebar();
    const interval = setInterval(checkSidebar, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Sidebar Debug Page</h1>
        <p className="text-gray-600 mb-4">
          This page is used to test the sidebar toggle functionality. 
          Click the menu button in the navbar to toggle the sidebar.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Sidebar Status</h3>
            <p className="text-blue-600">Current state: <span className="font-bold">{sidebarState}</span></p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Toggle Button</h3>
            <p className="text-green-600">Menu button in navbar should work</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Responsive</h3>
            <p className="text-purple-600">Sidebar should be responsive</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Look for the menu button (☰) in the top-left corner of the navbar</li>
          <li>Click the menu button to toggle the sidebar</li>
          <li>On desktop, the sidebar should slide in/out smoothly</li>
          <li>On mobile, the sidebar should overlay with a dark background</li>
          <li>Click outside the sidebar on mobile to close it</li>
        </ol>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Expected Behavior</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Sidebar should be open by default on desktop</li>
          <li>Sidebar should be closed by default on mobile</li>
          <li>Toggle button should be visible on all screen sizes</li>
          <li>Sidebar should contain navigation menu items</li>
          <li>Main content should adjust when sidebar toggles</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default DebugSidebar; 