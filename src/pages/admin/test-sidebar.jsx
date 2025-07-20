import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TestSidebar = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [toggleCount, setToggleCount] = useState(0);

  useEffect(() => {
    // Monitor sidebar visibility
    const checkSidebar = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const transform = window.getComputedStyle(sidebar).transform;
        const isVisible = transform === 'none' || transform.includes('translateX(0px)');
        setSidebarVisible(isVisible);
      }
    };

    checkSidebar();
    const interval = setInterval(checkSidebar, 500);
    return () => clearInterval(interval);
  }, []);

  // Monitor toggle button clicks
  useEffect(() => {
    const toggleButton = document.querySelector('button[title="Toggle sidebar"]');
    if (toggleButton) {
      const handleClick = () => {
        setToggleCount(prev => prev + 1);
      };
      toggleButton.addEventListener('click', handleClick);
      return () => toggleButton.removeEventListener('click', handleClick);
    }
  }, []);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Sidebar Test</h1>
        <p className="text-gray-600 mb-4">
          This page tests the admin sidebar toggle functionality.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border-2 ${
            sidebarVisible 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="font-semibold mb-2">Sidebar Status</h3>
            <p className={sidebarVisible ? 'text-green-700' : 'text-red-700'}>
              {sidebarVisible ? '✅ Visible' : '❌ Hidden'}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <h3 className="font-semibold mb-2">Toggle Count</h3>
            <p className="text-blue-700">{toggleCount} clicks</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-800">
            <li>Look for the menu button (☰) in the top-left corner</li>
            <li>Click the menu button to toggle the sidebar</li>
            <li>Watch the status change from Hidden to Visible</li>
            <li>The toggle count should increase with each click</li>
          </ol>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Debug Information</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          <p><strong>Sidebar Element:</strong> {typeof document !== 'undefined' && document.querySelector('aside') ? 'Found' : 'Not Found'}</p>
          <p><strong>Toggle Button:</strong> {typeof document !== 'undefined' && document.querySelector('button[title="Toggle sidebar"]') ? 'Found' : 'Not Found'}</p>
          <p><strong>Screen Width:</strong> {typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px</p>
        </div>
      </motion.div>
    </div>
  );
};

export default TestSidebar; 