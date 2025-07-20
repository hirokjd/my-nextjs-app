import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';

const DemoLogin = () => {
  return (
    <>
      <Head>
        <title>Login Demo - NIELIT Tezpur EC</title>
        <meta name="description" content="Demo of the new login design" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                New Login Design
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the modern, beautiful, and user-friendly login interface designed for NIELIT Tezpur EC Online Exam System
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Modern Design</h3>
              <p className="text-gray-600">Beautiful gradients, smooth animations, and intuitive user interface</p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Responsive</h3>
              <p className="text-gray-600">Perfect experience across all devices - desktop, tablet, and mobile</p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast & Smooth</h3>
              <p className="text-gray-600">Optimized animations and transitions for seamless user experience</p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure</h3>
              <p className="text-gray-600">Role-based authentication with proper session management</p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">User-Friendly</h3>
              <p className="text-gray-600">Intuitive navigation and clear visual feedback for all interactions</p>
            </motion.div>

            <motion.div 
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Accessible</h3>
              <p className="text-gray-600">WCAG compliant design with proper contrast and keyboard navigation</p>
            </motion.div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <motion.button
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Try New Login</span>
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              </Link>

              <Link href="/">
                <motion.button
                  className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </motion.button>
              </Link>
            </div>

            <p className="text-gray-500 text-sm">
              Experience the difference with our redesigned login interface
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DemoLogin; 