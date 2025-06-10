import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { databases, account } from "../../utils/appwrite";
import { BarChart, Users, FileText, CheckCircle, ClipboardList, BookCopy } from "lucide-react"; // Added BookCopy
import Link from "next/link";

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    exams: 0,
    questions: 0,
    courses: 0, // Added courses
    attempts: "N/A",
    passPercentage: "N/A"
  });
const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '67a5a946002e8a51f8fe';
  const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const EXAMS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const QUESTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
  const COURSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COURSE_COLLECTION_ID || 'course';


const fetchDashboardData = useCallback(async () => { // Wrapped in useCallback
    setLoading(true);
    setError(null);
try {
      const user = await account.get();
if (!user) {
        throw new Error("You must be logged in to view this dashboard");
}

      const [studentsData, examsData, questionsData, coursesData] = await Promise.all([ // Added coursesData
        databases.listDocuments(
          DATABASE_ID,
          STUDENTS_COLLECTION_ID
        ),
        databases.listDocuments(
          DATABASE_ID,
          EXAMS_COLLECTION_ID
        ),
        databases.listDocuments(
          DATABASE_ID,
          QUESTIONS_COLLECTION_ID
        ),
        databases.listDocuments( // Fetch courses
          DATABASE_ID,
          COURSES_COLLECTION_ID
        )
      ]);

const now = new Date();
const upcoming = examsData.documents
        .filter(exam => new Date(exam.exam_date) > now)
        .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
        .slice(0, 5);

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
          message: `${coursesData.total} courses available`, // Added courses activity
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
        courses: coursesData.total, // Set courses count
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
  }, [DATABASE_ID, STUDENTS_COLLECTION_ID, EXAMS_COLLECTION_ID, QUESTIONS_COLLECTION_ID, COURSES_COLLECTION_ID]); // Added dependencies

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Added fetchDashboardData to dependency array


  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}

  if (error) {
    return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
          Retry
          </button>
        </div>
    );
}

  return (
    <> {/* Removed AdminLayout as it's handled by _app.js */}
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6"> {/* Changed to md:grid-cols-4 */}
        <DashboardCard 
          icon={<Users size={28} />} 
          title="Total Students" 
          value={stats.students} 
link="/admin/students"
        />
        <DashboardCard 
          icon={<FileText size={28} />} 
          title="Total Exams" 
          value={stats.exams} 
          link="/admin/exams"
        />
         <DashboardCard 
          icon={<BookCopy size={28} />} 
          title="Total Courses" 
          value={stats.courses} 
          link="/admin/courses" // Link to new courses page
        />
        <DashboardCard 
          icon={<ClipboardList size={28} />} 
title="Total Questions" 
          value={stats.questions} 
          link="/admin/questions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-white shadow-md rounded-lg p-6"> {/* Removed mb-6 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📅 Upcoming Exams</h3>
            <Link href="/admin/exams" className="text-blue-600 hover:underline">
View All
            </Link>
          </div>
          {upcomingExams.length > 0 ?
(
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.$id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{exam.name}</h4>
                    <span className="text-sm text-gray-500">
{new Date(exam.exam_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Duration: {exam.duration} minutes | Status: {exam.status}
</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming exams scheduled.</p>
          )}
        </div>

        {/* Recent Activity - Now showing summary stats */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📊 System Summary</h3>
          {recentActivity.map((log, index) => (
            <div key={index} className="flex items-start mb-3 last:mb-0">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                </svg>
              </div>
              <div>
                <p className="text-gray-700">{log.message}</p>
                <p className="text-sm text-gray-500">{log.time}</p>
              </div>
</div>
          ))}
        </div>
      </div>
    </>
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