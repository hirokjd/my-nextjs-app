import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { loginAdmin, loginStudent } from "../utils/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
        localStorage.setItem('studentSession', JSON.stringify(studentSession));
        router.push("/student");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <motion.div
        className="relative bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl p-8 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            {role === "admin" ? "Admin Login" : "Student Login"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Sign in to your {role} dashboard
          </p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center mb-8">
          <div className="relative inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                role === "admin"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                role === "student"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
              onClick={() => setRole("student")}
            >
              Student
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              AscendingIcon
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 3v2m6.586-1.586a2 2 0 112.828 2.828l-5.586 5.586a2 2 0 01-2.828 0L4.757 7.757a2 2 0 010-2.828l5.586-5.586a2 2 0 012.828 0z" />
            </svg>
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <User
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200 transition-colors duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;