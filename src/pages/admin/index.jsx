import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { databases } from "../../utils/appwrite";
import { BarChart, Users, FileText, CheckCircle, ClipboardList } from "lucide-react";
import Link from "next/link";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    questions: 0,
    attempts: 0,
    passPercentage: 0,
  });

  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total students
      const studentsData = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
      );

      // Fetch total exams
      const examsData = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID
      );

      // Fetch total questions
      const questionsData = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID
      );

      // Fetch total exam attempts
      const attemptsData = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ATTEMPTS_COLLECTION_ID
      );

      // Fetch upcoming exams
      const upcoming = examsData.documents.filter(
        (exam) => new Date(exam.scheduledDate) > new Date()
      );

      // Fetch recent activity (mocked for now)
      const activityLogs = [
        { message: "Admin added a new student", time: "2 hours ago" },
        { message: "Exam 'Networking Basics' was created", time: "1 day ago" },
        { message: "5 new questions added to 'DBMS'", time: "3 days ago" },
      ];

      // Calculate pass percentage
      const passedExams = attemptsData.documents.filter(
        (attempt) => attempt.score >= attempt.passingMarks
      );
      const passPercentage =
        attemptsData.documents.length > 0
          ? (passedExams.length / attemptsData.documents.length) * 100
          : 0;

      setStats({
        students: studentsData.total,
        exams: examsData.total,
        questions: questionsData.total,
        attempts: attemptsData.total,
        passPercentage: passPercentage.toFixed(2),
      });

      setUpcomingExams(upcoming);
      setRecentActivity(activityLogs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        <DashboardCard icon={<Users size={28} />} title="Total Students" value={stats.students} />
        <DashboardCard icon={<FileText size={28} />} title="Total Exams" value={stats.exams} />
        <DashboardCard icon={<ClipboardList size={28} />} title="Total Questions" value={stats.questions} />
        <DashboardCard icon={<CheckCircle size={28} />} title="Total Attempts" value={stats.attempts} />
        <DashboardCard icon={<BarChart size={28} />} title="Pass %" value={`${stats.passPercentage}%`} />
      </div>

      {/* Upcoming Exams */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">📅 Upcoming Exams</h3>
        {upcomingExams.length > 0 ? (
          <ul>
            {upcomingExams.map((exam) => (
              <li key={exam.$id} className="mb-2">
                {exam.name} - {new Date(exam.scheduledDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No upcoming exams.</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">🛠 Recent Activity</h3>
        {recentActivity.map((log, index) => (
          <p key={index} className="text-gray-700 mb-1">
            {log.message} - <span className="text-gray-500">{log.time}</span>
          </p>
        ))}
      </div>
    </AdminLayout>
  );
};

const DashboardCard = ({ icon, title, value }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex items-center space-x-4">
      <div className="text-blue-500">{icon}</div>
      <div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-gray-700">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
