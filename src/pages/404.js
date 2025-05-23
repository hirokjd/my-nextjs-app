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
      router.push('/admin'); // Redirect to admin dashboard
    } else if (role === 'student') {
      router.push('/student'); // Redirect to student dashboard
    } else {
      router.push('/'); // Default fallback to home
    }
  };

  const handleGoBack = () => router.back(); // Go back to the previous page

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--muted-light)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="card p-8 text-center max-w-md w-full"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>404</h1>
        <p className="text-muted mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>

        <div className="flex flex-col gap-4">
          <motion.button
            onClick={handleGoHome}
            className="btn btn-primary flex items-center justify-center gap-2 w-full"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Home size={18} />
            Go to Dashboard
          </motion.button>

          <motion.button
            onClick={handleGoBack}
            className="btn btn-outline flex items-center justify-center gap-2 w-full"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
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