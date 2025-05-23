import React, { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import { getCurrentStudentSession } from '../../../utils/auth';
import { useRouter } from 'next/router';

const StudentExamsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const router = useRouter();

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const enrollmentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_ENROLLMENTS_COLLECTION_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;

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
    const fetchStudentData = async () => {
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

        // Query 2: Get all enrollments (we'll filter client-side)
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
            documents: enrollmentsResponse.documents.map(e => ({
              $id: e.$id,
              student_id: e.student_id,
              exam_id: e.exam_id,
              enrolled_at: e.enrolled_at
            }))
          });
        } catch (err) {
          logQuery('Get All Enrollments', enrollmentsQueryParams, null, err);
          throw err;
        }

        // Filter enrollments for current student
        const filteredEnrollments = enrollmentsResponse.documents.filter(enrollment => {
          // Handle both array and direct reference formats
          const studentRef = enrollment.student_id;
          
          if (Array.isArray(studentRef)) {
            // If student_id is an array of student documents
            return studentRef.some(s => s.$id === student.$id);
          } else if (typeof studentRef === 'object' && studentRef !== null) {
            // If student_id is a single student document
            return studentRef.$id === student.$id;
          } else {
            // If student_id is a direct ID string
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
            documents: examsResponse.documents.map(e => ({
              $id: e.$id,
              exam_id: e.exam_id,
              name: e.name,
              status: e.status
            }))
          });
        } catch (err) {
          logQuery('Get All Exams', examsQueryParams, null, err);
          throw err;
        }

        setExams(examsResponse.documents);
        setEnrollments(filteredEnrollments);
      } catch (err) {
        console.error('Error in fetchStudentData:', {
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
        setError(err.message || 'Failed to load your enrollments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [router]);

  const getExamDetails = (examId) => {
    if (!examId) return null;
    
    // Handle both array and direct reference formats
    let resolvedExamId;
    if (Array.isArray(examId)) {
      resolvedExamId = examId[0]?.$id || examId[0];
    } else if (typeof examId === 'object' && examId !== null) {
      resolvedExamId = examId.$id;
    } else {
      resolvedExamId = examId;
    }

    const exam = exams.find(e => e.$id === resolvedExamId || e.exam_id === resolvedExamId);
    
    if (!exam) {
      console.warn('Exam not found for ID:', examId);
      return null;
    }
    
    return exam;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', dateString, err);
      return 'Invalid Date';
    }
  };

  const handleStartExam = (examId) => {
    console.log('Starting exam with ID:', examId);
    router.push(`/student/exams/${examId}`);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title text-foreground">My Exams</h2>
        </div>
        <div className="dashboard-card flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted">Loading your exams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title text-foreground">My Exams</h2>
        </div>
        <div className="dashboard-card">
          <div className="p-4 border-l-4 border-danger bg-danger/10 text-danger rounded-md">
            <p className="font-medium">Error loading exams:</p>
            <p className="mt-1">{error}</p>
            <button
              onClick={() => {
                console.log('User clicked Try Again');
                window.location.reload();
              }}
              className="px-4 py-2 mt-3 bg-danger hover:bg-danger/90 text-danger-foreground rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title text-foreground">My Exams</h2>
        {studentInfo && (
          <p className="text-foreground">Welcome, {studentInfo.name} ({studentInfo.email})</p>
        )}
      </div>

      {enrollments.length === 0 ? (
        <div className="dashboard-card">
          <p className="p-4 text-center text-foreground">You are not currently enrolled in any exams.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const exam = getExamDetails(enrollment.exam_id);
            if (!exam) {
              console.warn('Skipping enrollment - exam not found:', enrollment);
              return null;
            }

            return (
              <div
                key={enrollment.$id}
                className="dashboard-card bg-card border border-border"
              >
                <h2 className="text-lg font-semibold text-foreground">{exam.name}</h2>
                <div className="mt-2 space-y-2 text-sm text-muted">
                  <p><span className="font-medium text-foreground">Exam ID:</span> {exam.exam_id || exam.$id}</p>
                  <p><span className="font-medium text-foreground">Date:</span> {formatDate(exam.exam_date)}</p>
                  <p><span className="font-medium text-foreground">Duration:</span> {exam.duration} minutes</p>
                  <p><span className="font-medium text-foreground">Status:</span> 
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      exam.status === 'active' ? 'bg-success/20 text-success' :
                      exam.status === 'completed' ? 'bg-muted/50 text-muted-foreground' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {exam.status}
                    </span>
                  </p>
                  <p><span className="font-medium text-foreground">Enrolled on:</span> {formatDate(enrollment.enrolled_at)}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleStartExam(exam.$id)}
                    disabled={exam.status !== 'active'}
                    className={`w-full px-4 py-2 rounded transition-colors ${
                      exam.status === 'active' 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {exam.status === 'active' ? 'Start Exam' : 'Exam Not Available'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExamsPage;