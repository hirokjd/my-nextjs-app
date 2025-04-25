//src/pages/login.js
import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { loginAdmin, loginStudent } from "../utils/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin"); // Default to Admin
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }
  
    try {
      if (role === "admin") {
        await loginAdmin(email, password);
        // router.push("/admin/dashboard");
        router.push("/admin");
      } else {
        const student = await loginStudent(email, password);
        if (student) {
          localStorage.setItem("studentSession", JSON.stringify(student)); // ✅ Store session
          console.log("Student session saved:", student); // ✅ Debugging log
          router.push("/student");
        } else {
          alert("Invalid student credentials.");
        }
      }
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };
  

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{role === "admin" ? "Admin Login" : "Student Login"}</h2>
          <p className="text-gray-500 mt-2">Access your {role} dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login As</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="student">Student</option>
            </select>
          </div>

          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn size={18} />
            Login
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
