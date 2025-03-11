"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Users, GraduationCap, FileText, Bell, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { account } from "../../utils/appwrite"; // Import Appwrite account instance

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <motion.div
    className="bg-white rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md transition"
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if the user is authenticated
    account.get().then(
      (response) => {
        setUser(response);
      },
      () => {
        router.push("/login"); // Redirect to login if not authenticated
      }
    );
  }, []);

  if (!user) {
    return <p className="text-center mt-10 text-lg font-semibold">Loading...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard icon={Users} label="Total Students" value="1,234" color="bg-blue-500" onClick={() => router.push("/admin/total-students")} />
        <StatCard icon={GraduationCap} label="Active Courses" value="12" color="bg-emerald-500" onClick={() => router.push("/courses")} />
        <StatCard icon={FileText} label="Upcoming Exams" value="8" color="bg-purple-500" onClick={() => router.push("/exams/exams")} />
        <StatCard icon={Bell} label="Manage Notifications" value="23" color="bg-amber-500" onClick={() => router.push("/admin/manage-notifications")} />
        <StatCard icon={Plus} label="Create Exams" value="+" color="bg-red-500" onClick={() => router.push("/exams/create")} />
      </div>
    </div>
  );
};

export default Dashboard;
