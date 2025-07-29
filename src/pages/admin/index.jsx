import React, { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { databases, account } from "../../utils/appwrite";
import { BarChart, Users, FileText, CheckCircle, ClipboardList, BookCopy } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "../../components/LoadingSpinner";
import dashboardCache, { CACHE_KEYS } from "../../utils/cache";
import performanceMonitor, { PERFORMANCE_OPS } from "../../utils/performance";
import { formatDateTimeUTC } from "../../utils/date";

// Skeleton loading component
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white shadow-md rounded-lg p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white shadow-md rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    questions: 0,
    courses: 0,
    attempts: "N/A",
    passPercentage: "N/A"
  });
const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoize environment variables
  const envConfig = useMemo(() => ({
    DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '67a5a946002e8a51f8fe',
    STUDENTS_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
    EXAMS_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
    QUESTIONS_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
    COURSES_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_COURSE_COLLECTION_ID || 'course'
  }), []);

  // Optimized data fetching with error handling and caching
  const fetchDashboardData = useCallback(async (showLoading = true, forceRefresh = false) => {
    if (showLoading) {
    setLoading(true);
    }
    setError(null);

try {
      // Check authentication first
      const user = await account.get();
if (!user) {
        throw new Error("You must be logged in to view this dashboard");
}

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedStats = dashboardCache.get(CACHE_KEYS.DASHBOARD_STATS);
        const cachedExams = dashboardCache.get(CACHE_KEYS.UPCOMING_EXAMS);
        const cachedActivity = dashboardCache.get(CACHE_KEYS.RECENT_ACTIVITY);

        if (cachedStats && cachedExams && cachedActivity) {
          setStats(cachedStats);
          setUpcomingExams(cachedExams);
          setRecentActivity(cachedActivity);
          setIsInitialLoad(false);
          setLoading(false);
          return;
        }
      }

      // Fetch data in parallel with timeout
      const fetchWithTimeout = (promise, timeout = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [studentsData, examsData, questionsData, coursesData] = await Promise.allSettled([
        fetchWithTimeout(databases.listDocuments(envConfig.DATABASE_ID, envConfig.STUDENTS_COLLECTION_ID)),
        fetchWithTimeout(databases.listDocuments(envConfig.DATABASE_ID, envConfig.EXAMS_COLLECTION_ID)),
        fetchWithTimeout(databases.listDocuments(envConfig.DATABASE_ID, envConfig.QUESTIONS_COLLECTION_ID)),
        fetchWithTimeout(databases.listDocuments(envConfig.DATABASE_ID, envConfig.COURSES_COLLECTION_ID))
      ]);

      // Handle partial failures gracefully
      const students = studentsData.status === 'fulfilled' ? studentsData.value : { total: 0, documents: [] };
      const exams = examsData.status === 'fulfilled' ? examsData.value : { total: 0, documents: [] };
      const questions = questionsData.status === 'fulfilled' ? questionsData.value : { total: 0, documents: [] };
      const courses = coursesData.status === 'fulfilled' ? coursesData.value : { total: 0, documents: [] };

      // Process upcoming exams
const now = new Date();
      const upcoming = exams.documents
        ?.filter(exam => new Date(exam.exam_date) > now)
        .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
        .slice(0, 5) || [];

      // Generate recent activity
const recentActivity = [
        { 
          message: `${students.total} students registered`, 
          time: new Date().toLocaleString(),
          type: 'students'
        },
        { 
          message: `${exams.total} exams created`, 
          time: new Date().toLocaleString(),
          type: 'exams'
        },
        { 
          message: `${courses.total} courses available`, 
          time: new Date().toLocaleString(),
          type: 'courses'
        },
        { 
          message: `${questions.total} questions available`, 
          time: new Date().toLocaleString(),
          type: 'questions'
        }
      ];

      const newStats = {
        students: students.total || 0,
        exams: exams.total || 0,
        questions: questions.total || 0,
        courses: courses.total || 0,
        attempts: "N/A",
        passPercentage: "N/A"
      };

      // Cache the data
      dashboardCache.set(CACHE_KEYS.DASHBOARD_STATS, newStats, 5 * 60 * 1000); // 5 minutes
      dashboardCache.set(CACHE_KEYS.UPCOMING_EXAMS, upcoming, 2 * 60 * 1000); // 2 minutes
      dashboardCache.set(CACHE_KEYS.RECENT_ACTIVITY, recentActivity, 5 * 60 * 1000); // 5 minutes

      setStats(newStats);
setUpcomingExams(upcoming);
      setRecentActivity(recentActivity);
      setIsInitialLoad(false);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
setError(error.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
}
  }, [envConfig]);

  // Initial load
  useEffect(() => {
    performanceMonitor.startTimer(PERFORMANCE_OPS.DASHBOARD_LOAD);
    fetchDashboardData().finally(() => {
      performanceMonitor.endTimer(PERFORMANCE_OPS.DASHBOARD_LOAD);
      performanceMonitor.logPerformance();
    });
  }, [fetchDashboardData]);

  // Auto-refresh every 5 minutes (only if not in error state)
  useEffect(() => {
    if (!error && !isInitialLoad) {
      const interval = setInterval(() => {
        fetchDashboardData(false); // Don't show loading for auto-refresh
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [error, isInitialLoad, fetchDashboardData]);

  // Memoize dashboard cards data
  const dashboardCards = useMemo(() => [
    {
      icon: <Users size={28} />,
      title: "Total Students",
      value: stats.students,
      link: "/admin/students",
      color: "blue"
    },
    {
      icon: <FileText size={28} />,
      title: "Total Exams",
      value: stats.exams,
      link: "/admin/exams",
      color: "green"
    },
    {
      icon: <BookCopy size={28} />,
      title: "Total Courses",
      value: stats.courses,
      link: "/admin/courses",
      color: "purple"
    },
    {
      icon: <ClipboardList size={28} />,
      title: "Total Questions",
      value: stats.questions,
      link: "/admin/questions",
      color: "orange"
    }
  ], [stats]);

  if (loading && isInitialLoad) {
    return (
      <div className="space-y-6">
        <motion.h2 
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Admin Dashboard
        </motion.h2>
        <DashboardSkeleton />
        </div>
    );
}

  if (error) {
    return (
      <motion.div 
        className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xs">!</span>
          </div>
          <h3 className="font-semibold">Error Loading Dashboard</h3>
        </div>
        <p className="mb-4">{error}</p>
          <button 
          onClick={() => fetchDashboardData()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
          Retry
          </button>
      </motion.div>
    );
}

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        {!isInitialLoad && (
          <motion.button
            onClick={() => fetchDashboardData(false, true)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Refresh
          </motion.button>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Placeholder for stats cards */}
        {dashboardCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <div className={`bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 border-l-4 border-${card.color}-500`}>
              <div>{card.icon}</div>
              <div>
                <div className="text-lg font-semibold">{card.value}</div>
                <div className="text-gray-500 text-sm">{card.title}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Sections */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Placeholder for Upcoming Exams */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">Upcoming Exams</h3>
          {upcomingExams.length === 0 ? (
            <div className="text-gray-500">No upcoming exams.</div>
          ) : (
            <ul className="space-y-2">
              {upcomingExams.map((exam) => (
                <li key={exam.$id} className="flex flex-col">
                  <span className="font-semibold">{exam.name}</span>
                  <span className="text-gray-500 text-sm">{formatDateTimeUTC(exam.exam_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Placeholder for System Summary */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">System Summary</h3>
          <ul className="space-y-2">
            {recentActivity.map((activity, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span className="text-gray-700">{activity.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;