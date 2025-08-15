import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, FileText, Award, Bell, CheckCircle } from 'lucide-react';
import { databases, Query } from '../utils/appwrite';

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const [hasPublishedResults, setHasPublishedResults] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);

  useEffect(() => {
    const checkForPublishedResults = async () => {
      try {
        const resultsResponse = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID,
          [Query.equal('publish', true), Query.limit(1)]
        );
        if (resultsResponse.total > 0) {
          setHasPublishedResults(true);
        }
      } catch (error) {
        console.error("Failed to check for published results:", error);
      } finally {
        setLoadingCheck(false);
      }
    };
    checkForPublishedResults();
  }, []);

  const handleImageError = (e) => {
    e.target.src = '/fallback-logo.png';
    e.target.alt = 'NIELIT Tezpur EC Fallback Logo';
  };

  return (
    <>
      <Head>
        <title>NIELIT Tezpur EC - Online Exam System</title>
        <meta name="description" content="NIELIT Tezpur EC Online Exam System - Secure exam platform for students and administrators." />
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="w-full bg-white border-b border-gray-200 py-4 fixed top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-3"
            >
              <a href="https://www.nielit.gov.in/tezpur/" target="_blank" rel="noopener noreferrer">
                <img
                  src="https://mimitmalout.ac.in/NIELIT.png"
                  alt="NIELIT Tezpur EC Logo"
                  className="h-10 w-10"
                  onError={handleImageError}
                />
              </a>
              <h1 className="text-xl font-semibold text-gray-900">
                NIELIT Tezpur EC
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Login
              </Link>
            </motion.div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            >
              Online Exam System
            </motion.h2>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
            >
              Secure and efficient exam platform for NIELIT Tezpur EC students
            </motion.p>
            
            {/* Published Results Banner */}
            {!loadingCheck && hasPublishedResults && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-md mx-auto"
              >
                <div className="flex items-center justify-center space-x-3 mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                  <span className="text-green-800 font-semibold">Results Published</span>
                </div>
                <p className="text-green-700 text-sm mb-4">
                  New exam results are now available for viewing
                </p>
                <Link
                  href="/results"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  View Results
                </Link>
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <Link
                href="/login"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg"
              >
                Access Portal
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold text-gray-900 text-center mb-12"
            >
              Platform Features
            </motion.h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div
                variants={itemVariants}
                className="text-center p-6"
              >
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Exam Access</h3>
                <p className="text-gray-600">
                  Take exams securely with real-time monitoring and instant feedback
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="text-center p-6"
              >
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Results & Analytics</h3>
                <p className="text-gray-600">
                  Detailed performance analysis with comprehensive result breakdowns
                </p>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="text-center p-6"
              >
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Certificates</h3>
                <p className="text-gray-600">
                  Download certificates upon successful completion of exams
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold text-gray-900 text-center mb-12"
            >
              Quick Actions
            </motion.h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            >
              <motion.div variants={itemVariants}>
                <Link
                  href="/login"
                  className="block p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <GraduationCap size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Student Login</h3>
                      <p className="text-gray-600">Access your exams and view results</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
              
              {!loadingCheck && hasPublishedResults && (
                <motion.div variants={itemVariants}>
                  <Link
                    href="/results"
                    className="block p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 rounded-lg p-3">
                        <CheckCircle size={24} className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">View Results</h3>
                        <p className="text-gray-600">Check published exam results</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-8 bg-gray-900 text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <img
                  src="https://mimitmalout.ac.in/NIELIT.png"
                  alt="NIELIT Tezpur EC Logo"
                  className="h-8 w-8"
                  onError={handleImageError}
                />
                <span className="text-lg font-semibold">NIELIT Tezpur EC</span>
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="https://www.nielit.gov.in/tezpur/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition-colors">
                  Official Website
                </a>
                <Link href="/contact" className="hover:text-blue-300 transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
              <p>© {new Date().getFullYear()} NIELIT Tezpur EC. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;