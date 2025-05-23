import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { loginAdmin, loginStudent } from "../utils/auth";
import Head from "next/head";

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
    <>
      <Head>
        <title>Login - Online Exam Portal</title>
        <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-muted-light dark:bg-muted-light/5 p-4">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20 dark:opacity-10">
            <div className="absolute inset-0 rotate-45 bg-gradient-to-r from-primary via-primary-light to-secondary blur-3xl"></div>
          </div>
        </div>
        
        <motion.div
          className="relative bg-card dark:bg-card backdrop-blur-sm shadow-xl rounded-xl overflow-hidden p-8 w-full max-w-md border border-border"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="https://mimitmalout.ac.in/NIELIT.png" 
              alt="Logo"
              className="h-12 w-12"
            />
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {role === "admin" ? "Admin Login" : "Student Login"}
            </h2>
            <p className="text-muted mt-2">
              Sign in to your {role} dashboard
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex justify-center mb-8">
            <div className="relative inline-flex items-center bg-muted-light dark:bg-muted-light/10 rounded-lg p-1">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  role === "admin"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
                onClick={() => setRole("admin")}
              >
                Admin
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  role === "student"
                    ? "bg-secondary text-white shadow-sm"
                    : "text-muted hover:text-foreground"
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
              className="mb-6 p-4 bg-danger/10 dark:bg-danger/20 text-danger rounded-lg flex items-center gap-2 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-4 py-3 pl-10 bg-muted-light/50 dark:bg-muted-light/5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-colors duration-200"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <User
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full px-4 py-3 pl-10 bg-muted-light/50 dark:bg-muted-light/5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-colors duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-white font-medium transition-all duration-200 ${
                role === "admin" 
                  ? "bg-primary hover:bg-primary-dark" 
                  : "bg-secondary hover:bg-secondary/90"
              }`}
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
    </>
  );
};

export default Login;