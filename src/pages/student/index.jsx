import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiBook, FiAward, FiUser, FiCalendar, FiClock, FiBarChart2 } from 'react-icons/fi';
import { databases } from '../../utils/appwrite';
import { Query } from 'appwrite';
import { useRouter } from 'next/router';

const StudentDashboard = () => {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentSession = localStorage.getItem('studentSession');
        if (!studentSession) {
          router.replace('/login');
          return;
        }

        const studentData = JSON.parse(studentSession);
        setStudent(studentData);
        await fetchStudentData(studentData.$id);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize dashboard. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchStudentData = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Verify student exists
      const studentDoc = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        studentId
      );

      // 2. Fetch enrollments for this student using the correct relationship query
      const enrollments = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
        [
          Query.equal('student_id', studentId) // This works because student_id is stored as a string
        ]
      );

      // 3. Get details for each enrolled exam
      const enrolledExams = await Promise.all(
        enrollments.documents.map(async (enrollment) => {
          try {
            return await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
              process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
              enrollment.exam_id
            );
          } catch (err) {
            console.error(`Error fetching exam ${enrollment.exam_id}:`, err);
            return null;
          }
        })
      );

      // 4. Filter upcoming exams (future dates)
      const now = new Date();
      const studentUpcomingExams = enrolledExams
        .filter(exam => exam !== null)
        .filter(exam => new Date(exam.exam_date) > now)
        .map(exam => ({
          id: exam.$id,
          name: exam.name,
          date: exam.exam_date,
          duration: `${exam.duration} minutes`,
          description: exam.description
        }));

      setUpcomingExams(studentUpcomingExams);

      // 5. Fetch results for this student
      const results = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID,
        [
          Query.equal('student_id', studentId), // This works because student_id is stored as a string
          Query.orderDesc('attempted_at'),
          Query.limit(3)
        ]
      );

      // 6. Get exam details for each result
      const resultsWithExamDetails = await Promise.all(
        results.documents.map(async (result) => {
          try {
            const exam = await databases.getDocument(
              process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
              process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
              result.exam_id
            );
            
            const percentage = Math.round((result.score / result.total_marks) * 100);
            return {
              id: result.$id,
              examId: exam.$id,
              exam: exam.name,
              score: `${percentage}%`,
              date: result.attempted_at,
              totalMarks: result.total_marks,
              obtainedMarks: result.score,
              status: result.status || 'completed'
            };
          } catch (err) {
            console.error(`Error fetching exam details for result ${result.$id}:`, err);
            return null;
          }
        })
      );

      setRecentResults(resultsWithExamDetails.filter(result => result !== null));

    } catch (err) {
      console.error('Data fetch error:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const refreshData = async () => {
    if (student?.$id) {
      setError(null);
      setLoading(true);
      await fetchStudentData(student.$id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Student data not available. Please login again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {student.name || 'Student'}!
            </h1>
            <p className="opacity-90">
              {upcomingExams.length > 0 
                ? `You have ${upcomingExams.length} upcoming exam${upcomingExams.length !== 1 ? 's' : ''}` 
                : 'No upcoming exams'}
            </p>
          </div>
          <button 
            onClick={refreshData}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
          <button 
            onClick={refreshData}
            className="mt-2 text-sm text-red-700 hover:underline"
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/student/exams" passHref>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <FiBook className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">My Exams</h2>
              <p className="mt-1 text-gray-600 text-sm">View and take upcoming exams</p>
            </div>
          </div>
        </Link>

        <Link href="/student/results" passHref>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <FiAward className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Results</h2>
              <p className="mt-1 text-gray-600 text-sm">Check your exam results</p>
            </div>
          </div>
        </Link>

        <Link href="/student/profile" passHref>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <FiUser className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
              <p className="mt-1 text-gray-600 text-sm">Update your information</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Exams Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiCalendar className="mr-2 text-blue-600" />
            Upcoming Exams
          </h2>
          <Link href="/student/exams" passHref>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
          </Link>
        </div>

        {upcomingExams.length > 0 ? (
          <div className="space-y-4">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <FiClock className="mr-1" /> {exam.duration}
                      </span>
                      {exam.description && (
                        <span className="block mt-1 text-gray-500 text-sm line-clamp-1">
                          {exam.description}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{formatDate(exam.date)}</p>
                    <Link href={`/student/exams/${exam.id}`} passHref>
                      <button className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No upcoming exams scheduled</p>
            <Link href="/student/exams" passHref>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Browse Available Exams
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Results Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiBarChart2 className="mr-2 text-green-600" />
            Recent Results
          </h2>
          <Link href="/student/results" passHref>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
          </Link>
        </div>

        {recentResults.length > 0 ? (
          <div className="space-y-4">
            {recentResults.map((result) => {
              const percentage = parseFloat(result.score);
              return (
                <div key={result.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">{result.exam}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(result.date)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Score: {result.obtainedMarks}/{result.totalMarks}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        percentage >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : percentage >= 50 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {result.score}
                      </span>
                      <Link href={`/student/results/${result.examId}`} passHref>
                        <button className="mt-2 px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No results available yet</p>
            <Link href="/student/exams" passHref>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Take an Exam
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;