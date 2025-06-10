import React, { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import { getCurrentStudentSession } from '../../../utils/auth';
import { useRouter } from 'next/router';
import { FileText } from 'lucide-react';

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

  const fetchStudentData = async () => {
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

  useEffect(() => {
    fetchStudentData();
  }, [router]);

  const getExamDetails = (examId) => {
    if (!examId) return null;
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

  const isExamStartable = (exam) => {
    if (exam.status !== 'active') return false;
    if (!exam.exam_date) return true; // If no exam_date, assume it can be started
    const examDate = new Date(exam.exam_date);
    const currentTime = new Date();
    const tenMinutesBefore = new Date(examDate.getTime() - 10 * 60 * 1000); // 10 minutes before exam
    return currentTime >= tenMinutesBefore;
  };

  const handleStartExam = (examId) => {
    console.log('Starting exam with ID:', examId);
    router.push(`/student/exams/${examId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 font-inter">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center">
              <FileText className="mr-2 text-blue-600" size={24} />
              My Exams
            </h1>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading your exams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 font-inter">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center">
              <FileText className="mr-2 text-blue-600" size={24} />
              My Exams
            </h1>
          </div>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm">
          <p className="font-semibold">Error loading exams:</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 font-inter">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center">
              <FileText className="mr-2 text-blue-600" size={24} />
              My Exams
            </h1>
            {studentInfo && (
              <p className="mt-1 text-sm text-gray-600">
                Welcome, {studentInfo.name} ({studentInfo.email})
              </p>
            )}
          </div>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-sm">
          <p className="font-semibold">No enrollments found</p>
          <p className="mt-1">You are not currently enrolled in any exams.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const exam = getExamDetails(enrollment.exam_id);
            if (!exam) {
              console.warn('Skipping enrollment - exam not found:', enrollment);
              return null;
            }

            return (
              <div
                key={enrollment.$id}
                className="p-4 border border-gray-200 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-800">{exam.name}</h2>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">Exam ID:</span> {exam.exam_id || exam.$id}</p>
                  <p><span className="font-semibold">Date:</span> {formatDate(exam.exam_date)}</p>
                  <p><span className="font-semibold">Duration:</span> {exam.duration} minutes</p>
                  <p>
                    <span className="font-semibold">Status:</span>
                    <span
                      className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        exam.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : exam.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {exam.status}
                    </span>
                  </p>
                  <p><span className="font-semibold">Enrolled on:</span> {formatDate(enrollment.enrolled_at)}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleStartExam(exam.$id)}
                    disabled={!isExamStartable(exam)}
                    className={`w-full px-4 py-2 rounded-md text-base font-semibold shadow-sm text-white ${
                      isExamStartable(exam)
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isExamStartable(exam) ? 'Start Exam' : 'Exam Not Available'}
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