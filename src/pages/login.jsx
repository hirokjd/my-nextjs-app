import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, LogIn, Eye, EyeOff, GraduationCap, Shield } from "lucide-react";
import { useRouter } from "next/router";
import { loginAdmin, loginStudent, getCurrentStudentSession } from "../utils/auth";
import { account } from "../utils/appwrite";
import Head from "next/head";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for admin session first
        await account.get();
        router.replace('/admin');
        return;
      } catch (_adminError) {
        // No admin session, check for student session
        const studentSession = getCurrentStudentSession();
        if (studentSession) {
          router.replace('/student');
          return;
        }
      }
      // If no sessions are found, stop loading
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (role === "admin") {
        await loginAdmin(email, password);
        router.push("/admin");
      } else {
        const studentSession = await loginStudent(email, password);
        // Use sessionStorage to ensure session ends when tab is closed
        sessionStorage.setItem('studentSession', JSON.stringify(studentSession));
        router.push("/student");
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Checking session...</p>
        </div>
      );
  }

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
        <title>Login - NIELIT Tezpur EC Online Exam System</title>
        <meta name="description" content="Secure login for NIELIT Tezpur EC Online Exam System" />
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>

      <div className="min-h-screen flex">
        {/* Left Side - Branding & Info */}
        <motion.div
          className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <div className="mb-8">
                <img
                  src="https://mimitmalout.ac.in/NIELIT.png"
                  alt="NIELIT Logo"
                  className="w-24 h-24 mx-auto mb-6 filter brightness-0 invert"
                />
                <h1 className="text-4xl font-bold mb-4">NIELIT Tezpur EC</h1>
                <h2 className="text-2xl font-light mb-6">Online Exam System</h2>
              </div>

              <div className="space-y-6 max-w-md">
                <motion.div
                  className="flex items-center space-x-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
                  variants={itemVariants}
                >
                  <Shield className="w-8 h-8 text-blue-200" />
                  <div className="text-left">
                    <h3 className="font-semibold">Secure Platform</h3>
                    <p className="text-blue-100 text-sm">Advanced security measures to protect your data</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center space-x-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
                  variants={itemVariants}
                >
                  <GraduationCap className="w-8 h-8 text-blue-200" />
                  <div className="text-left">
                    <h3 className="font-semibold">Professional Exams</h3>
                    <p className="text-blue-100 text-sm">Comprehensive testing environment for students</p>
                  </div>
                </motion.div>
                 <motion.div
                  className="flex items-center space-x-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm"
                  variants={itemVariants}
                >
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-bold text-sm">✓</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Real-time Results</h3>
                    <p className="text-blue-100 text-sm">Instant feedback and detailed analytics</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          className="flex-1 flex items-center justify-center p-8 bg-gray-50"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Mobile Logo */}
            <motion.div
              className="lg:hidden text-center mb-8"
              variants={itemVariants}
            >
              <img
                src="https://mimitmalout.ac.in/NIELIT.png"
                alt="NIELIT Logo"
                className="w-16 h-16 mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-800">NIELIT Tezpur EC</h1>
              <p className="text-gray-600">Online Exam System</p>
            </motion.div>

            {/* Login Card */}
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
              variants={itemVariants}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">
                  Sign in to access your dashboard
                </p>
              </div>

              {/* Role Toggle */}
              <motion.div
                className="flex justify-center mb-8"
                variants={itemVariants}
              >
                <div className="relative inline-flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
                   <motion.button
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative z-10 ${
                      role === "student"
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => setRole("student")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Student
                  </motion.button>
                  <motion.button
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative z-10 ${
                      role === "admin"
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => setRole("admin")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin
                  </motion.button>
                  <motion.div
                    className="absolute top-1 left-1 w-1/2 h-[calc(100%-8px)] bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
                    animate={{
                      x: role === "student" ? 0 : "100%"
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">!</span>
                    </div>
                    <span className="text-sm font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Input */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      className="w-full px-4 py-4 pl-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <User
                      size={20}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300"
                    />
                  </div>
                </motion.div>

                {/* Password Input */}
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-4 py-4 pl-12 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <motion.button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <LogIn size={20} />
                        <span>Sign In</span>
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div
                className="mt-8 text-center"
                variants={itemVariants}
              >
                <p className="text-sm text-gray-500">
                  Need help? Contact your administrator
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
