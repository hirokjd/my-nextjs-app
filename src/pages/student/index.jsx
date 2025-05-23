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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-foreground">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-danger/10 border-l-4 border-danger text-danger p-4 rounded">
          <p>Student data not available. Please login again.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome and Header */}
      <div className="dashboard-header mb-8">
        <h1 className="dashboard-title text-foreground">
          My Exams
        </h1>
        <p className="text-foreground">
          Welcome, {studentInfo?.name || 'Student'} ({studentInfo?.email})
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Exams Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border transition-all hover:shadow-md p-5 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiBook size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Exams</h2>
            <p className="text-sm text-muted mt-1">
              {upcomingExams.length} upcoming exam{upcomingExams.length !== 1 && 's'}
            </p>
            <Link href="/student/exams" className="inline-block mt-2 text-sm text-primary hover:underline">
              View Exams
            </Link>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border transition-all hover:shadow-md p-5 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <FiBarChart2 size={22} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Results</h2>
            <p className="text-sm text-muted mt-1">
              {recentResults.length} exam result{recentResults.length !== 1 && 's'}
            </p>
            <Link href="/student/results" className="inline-block mt-2 text-sm text-secondary hover:underline">
              View Results
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border transition-all hover:shadow-md p-5 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiUser size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
            <p className="text-sm text-muted mt-1">
              View and manage your profile
            </p>
            <Link href="/student/profile" className="inline-block mt-2 text-sm text-primary hover:underline">
              View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Exams Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-foreground flex items-center mb-4">
          <FiCalendar className="mr-2 text-primary" />
          Upcoming Exams
        </h2>

        {upcomingExams.length > 0 ? (
          <div className="space-y-4">
            {upcomingExams.map(exam => (
              <div 
                key={exam.id} 
                className="bg-card rounded-lg shadow-sm border border-border p-4 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">{exam.name}</h3>
                    <p className="text-sm text-muted mt-1">{exam.description}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="flex items-center text-sm text-muted">
                        <FiCalendar className="mr-1" /> {formatDate(exam.date)}
                      </span>
                      <span className="flex items-center text-sm text-muted">
                        <FiClock className="mr-1" /> {formatDuration(exam.duration)}
                      </span>
                    </div>
                  </div>
                  <Link 
                    href={`/student/exams/${exam.id}`}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm transition-colors"
                  >
                    View Exam
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 text-center">
            <p className="text-muted">No upcoming exams</p>
          </div>
        )}
      </div>

      {/* Recent Results Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-foreground flex items-center mb-4">
          <FiAward className="mr-2 text-secondary" />
          Recent Results
        </h2>

        {recentResults.length > 0 ? (
          <div className="space-y-4">
            {recentResults.map(result => (
              <div 
                key={result.id} 
                className="bg-card rounded-lg shadow-sm border border-border p-4 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">{result.exam}</h3>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="flex items-center text-sm text-muted">
                        Score: <span className="ml-1 font-medium text-foreground">{result.obtainedMarks}/{result.totalMarks}</span>
                      </span>
                      <span className="flex items-center text-sm text-muted">
                        Percentage: <span className="ml-1 font-medium text-foreground">{result.score}%</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        result.status === "passed" || result.status === "Pass" 
                          ? "bg-success/20 text-success" 
                          : "bg-danger/20 text-danger"
                      }`}>
                        {result.status === "passed" ? "Passed" : result.status === "failed" ? "Failed" : result.status}
                      </span>
                    </div>
                  </div>
                  <Link 
                    href={`/student/results/${result.id}`}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm transition-colors"
                  >
                    View Result
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 text-center">
            <p className="text-muted">No results found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;