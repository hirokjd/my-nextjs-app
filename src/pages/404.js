import React from 'react';
import { useRouter } from 'next/router'; // For navigation
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react'; // Icons for navigation

const NotFound = () => {
  const router = useRouter();

  // Get the user role from the query parameter (e.g., ?role=admin or ?role=student)
  const { role } = router.query;

  // Handle redirection based on the user's role
  const handleGoHome = () => {
    if (role === 'admin') {
      router.push('/admin/dashboard'); // Redirect to admin dashboard
    } else if (role === 'student') {
      router.push('/student/dashboard'); // Redirect to student dashboard
    } else {
      router.push('/'); // Default fallback to home
    }
  };

  const handleGoBack = () => router.back(); // Go back to the previous page

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md w-full"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-gray-600 mb-6">
          Oops! The page you're looking for doesn't exist.
        </p>

        <div className="flex flex-col gap-4">
          <motion.button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home size={18} />
            Go to Dashboard
          </motion.button>

          <motion.button
            onClick={handleGoBack}
            className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={18} />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;