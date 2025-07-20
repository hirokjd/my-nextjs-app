import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { Shield, GraduationCap, Clock, Award, Users, BookOpen, ArrowRight } from "lucide-react";
import Head from "next/head";

const Home = () => {
  const router = useRouter();

  const features = [
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Advanced security measures to protect your data and ensure exam integrity"
    },
    {
      icon: GraduationCap,
      title: "Professional Exams",
      description: "Comprehensive testing environment designed for educational excellence"
    },
    {
      icon: Clock,
      title: "Real-time Monitoring",
      description: "Live tracking and monitoring of exam progress and performance"
    },
    {
      icon: Award,
      title: "Instant Results",
      description: "Get immediate feedback and detailed analytics after completion"
    },
    {
      icon: Users,
      title: "Multi-role Support",
      description: "Separate interfaces for administrators and students"
    },
    {
      icon: BookOpen,
      title: "Comprehensive Management",
      description: "Complete exam lifecycle management from creation to results"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      <Head>
        <title>NIELIT Tezpur EC - Online Exam System</title>
        <meta name="description" content="Professional online examination system for NIELIT Tezpur EC" />
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img
                  src="https://mimitmalout.ac.in/NIELIT.png"
                  alt="NIELIT Logo"
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-gray-800">NIELIT Tezpur EC</span>
              </div>
              <div className="flex space-x-4">
                <motion.button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.button>
                <motion.button
                  onClick={() => router.push('/login')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section 
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8"
              >
                <img 
                  src="https://mimitmalout.ac.in/NIELIT.png" 
                  alt="NIELIT Logo"
                  className="w-24 h-24 mx-auto mb-6"
                />
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Online Exam System
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Professional, secure, and comprehensive online examination platform designed for 
                educational excellence at NIELIT Tezpur EC.
              </motion.p>
              
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <motion.button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin Login</span>
                </motion.button>
                <motion.button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Student Login</span>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          className="py-20 bg-white"
                variants={containerVariants}
                initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
              >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
                  variants={itemVariants}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Built with modern technology and security in mind, our platform provides 
                everything you need for successful online examinations.
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students and administrators who trust our platform for their examination needs.
            </p>
            <motion.button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold flex items-center justify-center space-x-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Start Now</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <img 
                  src="https://mimitmalout.ac.in/NIELIT.png" 
                  alt="NIELIT Logo"
                  className="w-8 h-8 filter brightness-0 invert"
                />
                <span className="text-xl font-bold">NIELIT Tezpur EC</span>
              </div>
              <p className="text-gray-400">
                Professional online examination system for educational excellence
              </p>
              <p className="text-gray-500 text-sm mt-4">
                © 2024 NIELIT Tezpur EC. All rights reserved.
              </p>
              </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home; 