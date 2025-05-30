import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, FileText, Award, Bell } from 'lucide-react';

const HomePage = () => {
  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Fallback handler for logo loading errors
  const handleImageError = (e) => {
    e.target.src = '/fallback-logo.png'; // Fallback image (place in public folder)
    e.target.alt = 'NIELIT Tezpur EC Fallback Logo';
  };

  return (
    <>
      <Head>
        <title>NIELIT Tezpur EC - Online Exam System</title>
        <meta name="description" content="Empowering education with the NIELIT Tezpur EC Online Exam System. Access exams, view results, and manage your academic journey seamlessly." />
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="w-full bg-[#f8fafc] border-b border-[#e2e8f0] py-4 fixed top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <Link href="https://www.nielit.gov.in/tezpur/" target="_blank" rel="noopener noreferrer">
                <img
                  src="https://mimitmalout.ac.in/NIELIT.png"
                  alt="NIELIT Tezpur EC Logo"
                  className="h-12 w-12"
                  onError={handleImageError}
                />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b]">
                NIELIT Tezpur EC Exam Portal
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/login">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium sm:text-base">
                  Login
                </button>
              </Link>
            </motion.div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-24 pb-12 bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-6"
            >
              Welcome to NIELIT Tezpur EC Online Exam System
            </motion.h2>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8"
            >
              A secure and user-friendly platform designed by NIELIT Tezpur EC to manage exams, track results, and empower students and administrators.
            </motion.p>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex justify-center space-x-4"
            >
              <Link href="/login">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium">
                  Get Started
                </button>
              </Link>
              <Link href="#features">
                <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-lg font-medium">
                  Learn More
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold text-gray-800 text-center mb-10"
            >
              Why Choose Our Platform?
            </motion.h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <motion.div
                variants={itemVariants}
                className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <GraduationCap size={40} className="text-blue-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-800 text-center">Easy Exam Access</h3>
                <p className="mt-2 text-gray-600 text-center">
                  Students can view and take exams effortlessly with real-time status updates.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <FileText size={40} className="text-blue-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-800 text-center">Detailed Results</h3>
                <p className="mt-2 text-gray-600 text-center">
                  Access comprehensive result analytics with question-by-question breakdowns.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <Award size={40} className="text-blue-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-800 text-center">Certificates</h3>
                <p className="mt-2 text-gray-600 text-center">
                  Earn and download certificates upon successful exam completion.
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="p-6 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <Bell size={40} className="text-blue-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-800 text-center">Real-Time Notifications</h3>
                <p className="mt-2 text-gray-600 text-center">
                  Stay updated with instant notifications for exam schedules and results.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="lg:w-1/2"
              >
                <Link href="https://www.nielit.gov.in/tezpur/" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://mimitmalout.ac.in/NIELIT.png"
                    alt="NIELIT Tezpur EC"
                    className="w-48 h-48 mx-auto lg:mx-0"
                    onError={handleImageError}
                  />
                </Link>
              </motion.div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="lg:w-1/2"
              >
                <motion.h2
                  variants={itemVariants}
                  className="text-3xl font-bold text-gray-800 mb-4"
                >
                  About NIELIT Tezpur EC
                </motion.h2>
                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 mb-4"
                >
                  The National Institute of Electronics & Information Technology (NIELIT) Tezpur Extension Centre is committed to advancing technical education through innovative solutions. Our Online Exam System provides a secure, efficient platform for conducting exams, managing student records, and delivering results.
                </motion.p>
                <motion.p
                  variants={itemVariants}
                  className="text-gray-600 mb-6"
                >
                  Explore our programs and initiatives at the official NIELIT Tezpur EC website.
                </motion.p>
                <motion.div variants={itemVariants}>
                  <Link href="https://www.nielit.gov.in/tezpur/" target="_blank" rel="noopener noreferrer">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium">
                      Visit NIELIT Tezpur EC
                    </button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section className="py-12 bg-blue-600 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold mb-4"
            >
              Ready to Begin?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-lg max-w-2xl mx-auto mb-6"
            >
              Join the NIELIT Tezpur EC community. Login now to access your exams and dashboard.
            </motion.p>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <Link href="/login">
                <button className="px-6 py-3 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors text-lg font-medium">
                  Login Now
                </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-6 bg-[#f8fafc] border-t border-[#e2e8f0]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <p className="text-gray-600 text-sm mb-2">
                © {new Date().getFullYear()} NIELIT Tezpur EC. All rights reserved.
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500 mb-2">
                <Link href="/about" className="hover:text-blue-600">
                  About
                </Link>
                <Link href="/contact" className="hover:text-blue-600">
                  Contact
                </Link>
                <Link href="/privacy" className="hover:text-blue-600">
                  Privacy Policy
                </Link>
                <Link href="https://www.nielit.gov.in/tezpur/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  NIELIT Tezpur EC
                </Link>
              </div>
            </motion.div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;