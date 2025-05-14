import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiBook, FiAward, FiUser, FiCalendar, FiClock, FiBarChart2 } from 'react-icons/fi';
import { databases, Query } from '../../utils/appwrite';
import { getCurrentStudentSession } from '../../utils/auth';
import { useRouter } from 'next/router';

const StudentDashboard = () => {
  const router = useRouter();
  const [studentInfo, setStudentInfo] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const enrollmentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_ENROLLMENTS_COLLECTION_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;

  const logQuery = (queryName, params, result, error = null) => {
    console.groupCollapsed(`Query: ${queryName}`);
    console.log('Params:', params);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Result:', result);
    }
    console.groupEnd();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check student session
        const session = getCurrentStudentSession();
        if (!session?.email) {
          router.push('/login');
          return;
        }

        // Query 1: Get student by email
        const studentQueryParams = {
          databaseId,
          collectionId: studentsCollectionId,
          queries: [Query.equal('email', session.email)]
        };

        let studentResponse;
        try {
          studentResponse = await databases.listDocuments(
            studentQueryParams.databaseId,
            studentQueryParams.collectionId,
            studentQueryParams.queries
          );
          logQuery('Get Student by Email', studentQueryParams, {
            total: studentResponse.total,
            documents: studentResponse.documents.map(d => ({
              $id: d.$id,
              name: d.name,
              email: d.email
            }))
          });
        } catch (err) {
          logQuery('Get Student by Email', studentQueryParams, null, err);
          throw err;
        }

        if (studentResponse.total === 0) {
          throw new Error('Student record not found');
        }

        const student = studentResponse.documents[0];
        setStudentInfo({
          name: student.name,
          email: student.email,
          studentId: student.$id,
        });

        // Query 2: Get all enrollments and filter client-side
        const enrollmentsQueryParams = {
          databaseId,
          collectionId: enrollmentsCollectionId,
          queries: []
        };

        let enrollmentsResponse;
        try {
          enrollmentsResponse = await databases.listDocuments(
            enrollmentsQueryParams.databaseId,
            enrollmentsQueryParams.collectionId,
            enrollmentsQueryParams.queries
          );
          logQuery('Get All Enrollments', enrollmentsQueryParams, {
            total: enrollmentsResponse.total,
            documents: enrollmentsResponse.documents
          });
        } catch (err) {
          logQuery('Get All Enrollments', enrollmentsQueryParams, null, err);
          throw err;
        }

        // Filter enrollments for current student
        const filteredEnrollments = enrollmentsResponse.documents.filter(enrollment => {
          const studentRef = enrollment.student_id;
          
          if (Array.isArray(studentRef)) {
            return studentRef.some(s => s.$id === student.$id);
          } else if (typeof studentRef === 'object' && studentRef !== null) {
            return studentRef.$id === student.$id;
          } else {
            return studentRef === student.$id;
          }
        });

        console.log('Client-side filtered enrollments:', {
          originalCount: enrollmentsResponse.total,
          filteredCount: filteredEnrollments.length,
          enrollments: filteredEnrollments
        });

        // Query 3: Get all exams
        const examsQueryParams = {
          databaseId,
          collectionId: examsCollectionId,
          queries: []
        };

        let examsResponse;
        try {
          examsResponse = await databases.listDocuments(
            examsQueryParams.databaseId,
            examsQueryParams.collectionId,
            examsQueryParams.queries
          );
          logQuery('Get All Exams', examsQueryParams, {
            total: examsResponse.total,
            documents: examsResponse.documents
          });
        } catch (err) {
          logQuery('Get All Exams', examsQueryParams, null, err);
          throw err;
        }

        // Get upcoming exams (future dates)
        const now = new Date();
        const studentUpcomingExams = examsResponse.documents.filter(exam => {
          const examId = exam.$id;
          const isEnrolled = filteredEnrollments.some(e => {
            const examRef = e.exam_id;
            if (Array.isArray(examRef)) {
              return examRef.some(e => e.$id === examId);
            } else if (typeof examRef === 'object' && examRef !== null) {
              return examRef.$id === examId;
            } else {
              return examRef === examId;
            }
          });
          return isEnrolled && new Date(exam.exam_date) > now;
        }).map(exam => ({
          id: exam.$id,
          name: exam.name,
          date: exam.exam_date,
          duration: exam.duration,
          description: exam.description
        }));

        setUpcomingExams(studentUpcomingExams);

        // Query 4: Get all results and filter client-side
        const resultsQueryParams = {
          databaseId,
          collectionId: resultsCollectionId,
          queries: []
        };

        let resultsResponse;
        try {
          resultsResponse = await databases.listDocuments(
            resultsQueryParams.databaseId,
            resultsQueryParams.collectionId,
            resultsQueryParams.queries
          );
          logQuery('Get All Results', resultsQueryParams, {
            total: resultsResponse.total,
            documents: resultsResponse.documents
          });
        } catch (err) {
          logQuery('Get All Results', resultsQueryParams, null, err);
          throw err;
        }

        // Filter results for current student and sort by date
        const studentResults = resultsResponse.documents
          .filter(result => {
            const studentRef = result.student_id;
            if (Array.isArray(studentRef)) {
              return studentRef.some(s => s.$id === student.$id);
            } else if (typeof studentRef === 'object' && studentRef !== null) {
              return studentRef.$id === student.$id;
            } else {
              return studentRef === student.$id;
            }
          })
          .sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at))
          .slice(0, 3); // Get only the 3 most recent

        // Get exam details for each result
        const resultsWithExamDetails = await Promise.all(
          studentResults.map(async (result) => {
            const examId = result.exam_id?.$id || result.exam_id;
            const exam = examsResponse.documents.find(e => e.$id === examId);
            
            const percentage = Math.round((result.score / result.total_marks) * 100);
            return {
              id: result.$id,
              examId: exam?.$id || 'unknown',
              exam: exam?.name || 'Unknown Exam',
              score: percentage,
              date: result.attempted_at,
              totalMarks: result.total_marks,
              obtainedMarks: result.score,
              status: result.status || (percentage >= 30 ? 'passed' : 'failed')
            };
          })
        );

        setRecentResults(resultsWithExamDetails);
      } catch (err) {
        console.error('Error in fetchDashboardData:', {
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
        setError(err.message || 'Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', dateString, err);
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const refreshData = async () => {
    setError(null);
    setLoading(true);
    try {
      const session = getCurrentStudentSession();
      if (session?.email) {
        await fetchDashboardData();
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>Student data not available. Please login again.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Go to Login
          </button>
        </div>
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
              Welcome back, {studentInfo.name}!
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
                        <FiClock className="mr-1" /> {formatDuration(exam.duration)}
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
            {recentResults.map((result) => (
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
                      result.score >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : result.score >= 50 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {result.score}%
                    </span>
                    <Link href={`/student/results/${result.examId}`} passHref>
                      <button className="mt-2 px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
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