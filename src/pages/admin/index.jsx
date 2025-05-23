import React, { useEffect, useState } from "react";
// import AdminLayout from "../../components/AdminLayout";
import { databases, account } from "../../utils/appwrite";
import { BarChart, Users, FileText, CheckCircle, ClipboardList, LayoutDashboard, Calendar } from "lucide-react";
import Link from "next/link";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    questions: 0,
    attempts: "N/A", // Removed attempts count
    passPercentage: "N/A" // Removed pass percentage
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verify user is authenticated
      const user = await account.get();
      if (!user) {
        throw new Error("You must be logged in to view this dashboard");
      }

      // Fetch only the collections we have access to
      const [studentsData, examsData, questionsData] = await Promise.all([
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID
        )
      ]);

      // Filter upcoming exams
      const now = new Date();
      const upcoming = examsData.documents
        .filter(exam => new Date(exam.exam_date) > now)
        .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
        .slice(0, 5);

      // Mock recent activity since we don't have exam_attempts
      const recentActivity = [
        { 
          message: `${studentsData.total} students registered`, 
          time: new Date().toLocaleString() 
        },
        { 
          message: `${examsData.total} exams created`, 
          time: new Date().toLocaleString() 
        },
        { 
          message: `${questionsData.total} questions available`, 
          time: new Date().toLocaleString() 
        }
      ];

      setStats({
        students: studentsData.total,
        exams: examsData.total,
        questions: questionsData.total,
        attempts: "N/A",
        passPercentage: "N/A"
      });

      setUpcomingExams(upcoming);
      setRecentActivity(recentActivity);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 text-dark-text">Loading dashboard data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger/10 border-l-4 border-danger text-danger p-4 mb-6 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 btn btn-danger"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <LayoutDashboard className="text-primary" />
          Admin Dashboard
        </h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/students" className="stats-card">
          <div className="stats-icon stats-icon-primary">
            <Users size={24} />
          </div>
          <div>
            <div className="stats-value">{stats.students}</div>
            <div className="stats-label">Students</div>
          </div>
        </Link>
        
        <Link href="/admin/exams" className="stats-card">
          <div className="stats-icon stats-icon-secondary">
            <FileText size={24} />
          </div>
          <div>
            <div className="stats-value">{stats.exams}</div>
            <div className="stats-label">Exams</div>
          </div>
        </Link>
        
        <Link href="/admin/questions" className="stats-card">
          <div className="stats-icon stats-icon-accent">
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="stats-value">{stats.questions}</div>
            <div className="stats-label">Questions</div>
          </div>
        </Link>
      </div>

      {/* Upcoming Exams Section */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <Calendar className="text-primary" />
            Upcoming Exams
          </h2>
          <Link href="/admin/exams" className="text-primary hover:text-primary-dark text-sm">
            View All
          </Link>
        </div>
        
        <div className="dashboard-card-content">
          {upcomingExams.length > 0 ? (
            upcomingExams.map((exam) => (
              <div key={exam.$id} className="dashboard-list-item">
                <div className="dashboard-list-item-header">
                  <div>
                    <h3 className="dashboard-list-item-title">{exam.name}</h3>
                    <p className="dashboard-list-item-subtitle">{exam.exam_id}</p>
                  </div>
                  <span className="status-badge status-badge-upcoming">
                    {exam.status}
                  </span>
                </div>
                <div className="dashboard-list-item-content">
                  <span className="text-sm text-muted">
                    Date: {new Date(exam.exam_date).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-muted">
                    Duration: {exam.duration} minutes
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted">
              No upcoming exams scheduled
            </div>
          )}
        </div>
      </div>

      {/* System Activity Section */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <BarChart className="text-primary" />
            System Summary
          </h2>
        </div>
        
        <div className="dashboard-card-content">
          {recentActivity.map((activity, index) => (
            <div key={index} className="data-list-item">
              <div className="data-list-icon">
                <CheckCircle size={16} className="text-primary" />
              </div>
              <div className="data-list-content">
                <div className="data-list-title">{activity.message}</div>
                <div className="data-list-meta">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ icon, title, value, link }) => {
  const content = (
    <div className={`bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 h-full ${link ? 'hover:shadow-lg transition-shadow' : ''}`}>
      <div className="text-blue-500">{icon}</div>
      <div>
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="text-gray-700">{value}</p>
      </div>
    </div>
  );

  return link ? (
    <Link href={link} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
};

export default Dashboard;
