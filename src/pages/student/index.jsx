import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiBook, FiAward, FiCalendar, FiClock, FiBarChart2, FiX } from 'react-icons/fi';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

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
        const session = getCurrentStudentSession();
        if (!session?.email) {
          router.push('/login');
          return;
        }

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
          description: exam.description || 'No description available' // Include description for modal
        }));

        setUpcomingExams(studentUpcomingExams);

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
          .slice(0, 3);

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
    return `${minutes} min`; // Show duration in minutes only
  };

  const handleViewDetails = (exam) => {
    setSelectedExam(exam);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 font-inter">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 font-inter">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
          <p>Student data not available. Please login again.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold shadow-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 font-inter">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">
              Welcome back, {studentInfo.name}!
            </h1>
            <p className="text-gray-600">
              {upcomingExams.length > 0 
                ? `You have ${upcomingExams.length} upcoming exam${upcomingExams.length !== 1 ? 's' : ''}` 
                : 'No upcoming exams'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg shadow-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Link href="/student/exams" passHref>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-all cursor-pointer flex items-start">
            <div className="bg-blue-100 p-3 rounded-md mr-4">
              <FiBook className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">My Exams</h2>
              <p className="mt-1 text-gray-600 text-sm">View and take upcoming exams</p>
            </div>
          </div>
        </Link>

        <Link href="/student/results" passHref>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-all cursor-pointer flex items-start">
            <div className="bg-green-100 p-3 rounded-md mr-4">
              <FiAward className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Results</h2>
              <p className="mt-1 text-gray-600 text-sm">Check your exam results</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Exams Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiCalendar className="mr-2 text-blue-600 text-xl" />
            Upcoming Exams
          </h2>
          <Link href="/student/exams" passHref>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
          </Link>
        </div>

        {upcomingExams.length > 0 ? (
          <div className="space-y-4">
            {upcomingExams.map((exam) => (
              <div key={exam.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <span className="flex items-center">
                        <FiClock className="mr-1 text-gray-500" /> {formatDuration(exam.duration)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formatDate(exam.date)}</p>
                    <button
                      onClick={() => handleViewDetails(exam)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-semibold shadow-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No upcoming exams scheduled</p>
            <Link href="/student/exams" passHref>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-semibold shadow-sm">
                Browse Available Exams
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Results Section */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiBarChart2 className="mr-2 text-green-600 text-xl" />
            Recent Results
          </h2>
          <Link href="/student/results" passHref>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
          </Link>
        </div>

        {recentResults.length > 0 ? (
          <div className="space-y-4">
            {recentResults.map((result) => (
              <div key={result.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{result.exam}</h3>
                    <p className="text-sm text-gray-600 mt-1">{formatDate(result.date)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Score: {result.obtainedMarks}/{result.totalMarks}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      result.score >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : result.score >= 50 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {result.score}%
                    </span>
                    <Link href={`/student/results/${result.examId}`} passHref>
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
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
            <p className="text-gray-600 mb-4">No results available yet</p>
            <Link href="/student/exams" passHref>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-semibold shadow-sm">
                Take an Exam
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Exam Description Modal */}
      {isModalOpen && selectedExam && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedExam.name}</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-gray-600 font-semibold">Description:</p>
              <p className="text-gray-700 mt-1">{selectedExam.description}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;