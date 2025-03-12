import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, Award, BookOpen } from "lucide-react";

const StudentDashboard = () => {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentSession = localStorage.getItem("studentSession");

    if (studentSession) {
      console.log("✅ Student session found:", studentSession);
      setStudent(JSON.parse(studentSession));
      setLoading(false);
    } else {
      console.warn("⚠ No student session found, redirecting to login...");
      router.replace("/login");
    }
  }, []);

  if (loading) return <p className="text-center mt-10 text-lg font-semibold">Loading...</p>;

  return (
    <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <motion.h1
        className="text-2xl font-bold text-gray-800 mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Welcome back, {student.name}!
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <StatCard
          icon={ClipboardList}
          label="Completed Exams"
          value="12"
          color="bg-emerald-500"
          onClick={() => router.push("/exams/completed")}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Exams"
          value="3"
          color="bg-blue-500"
          onClick={() => router.push("/exams/exams")}
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value="5"
          color="bg-amber-500"
          onClick={() => router.push("/student/certificates")}
        />
      </motion.div>

      <motion.div
        className="bg-white rounded-xl p-6 shadow-sm mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Exam</h2>
        <motion.div
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-green-500" />
            <span className="text-sm font-medium">Operating System</span>
          </div>
          <motion.button
            onClick={() => router.push("/exams/take")}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Exam
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// StatCard component
const StatCard = ({ icon: Icon, label, value, color, size = 24, onClick }) => (
  <motion.div
    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
        <Icon size={size} className="text-white" />
      </div>
    </div>
  </motion.div>
);

export default StudentDashboard;
