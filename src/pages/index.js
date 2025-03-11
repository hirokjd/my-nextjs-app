import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/router";
import { account } from "../utils/appwrite";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }
    
    if (role === "admin") {
      try {
        await account.createEmailPasswordSession(email, password);
        router.push("/admin/dashboard");
      } catch (error) {
        alert("Login failed: " + error.message);
      }
    } else {
      alert("Student login not yet implemented");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <motion.div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative z-10"
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Admin Login</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input type="email" className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg" 
                placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type="password" className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg" 
                placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
            </div>
          </div>

          <motion.button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <LogIn size={18} /> Login
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;