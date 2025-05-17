import { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import { getCurrentStudentSession } from '../../../utils/auth';
import Link from 'next/link';

const ResultsListPage = () => {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;
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
    const fetchResultsData = async () => {
      try {
        // Check student session
        const session = await getCurrentStudentSession();
        if (!session?.email) {
          console.warn('No valid session found, redirecting to login');
          window.location.href = '/login';
          return;
        }

        // Query 1: Get student by email
        const studentQueryParams = {
          databaseId,
          collectionId: studentsCollectionId,
          queries: [Query.equal('email', session.email)],
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
            documents: studentResponse.documents.map((d) => ({
              $id: d.$id,
              name: d.name,
              email: d.email,
            })),
          });
        } catch (err) {
          logQuery('Get Student by Email', studentQueryParams, null, err);
          throw new Error(`Failed to fetch student: ${err.message}`);
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

        // Query 2: Get results for student
        const resultsQueryParams = {
          databaseId,
          collectionId: resultsCollectionId,
          queries: [Query.equal('student_id', student.$id)],
        };

        let resultsResponse;
        try {
          resultsResponse = await databases.listDocuments(
            resultsQueryParams.databaseId,
            resultsQueryParams.collectionId,
            resultsQueryParams.queries
          );
          logQuery('Get Student Results', resultsQueryParams, {
            total: resultsResponse.total,
            documents: resultsResponse.documents,
          });
        } catch (err) {
          logQuery('Get Student Results', resultsQueryParams, null, err);
          throw new Error(`Failed to fetch results: ${err.message}`);
        }

        const filteredResults = resultsResponse.documents;
        console.log('Fetched results:', {
          count: filteredResults.length,
          results: filteredResults.map((r) => ({
            $id: r.$id,
            exam_id: r.exam_id,
            score: r.score,
          })),
        });
        setResults(filteredResults);

        // Query 3: Get exams for results
        const examIds = filteredResults
          .map((result) => {
            if (Array.isArray(result.exam_id)) {
              return result.exam_id[0]?.$id || result.exam_id[0];
            } else if (typeof result.exam_id === 'object' && result.exam_id !== null) {
              return result.exam_id.$id || result.exam_id.id;
            }
            return result.exam_id;
          })
          .filter((id) => id);

        let examsResponse;
        if (examIds.length > 0) {
          const examsQueryParams = {
            databaseId,
            collectionId: examsCollectionId,
            queries: [Query.contains('$id', examIds)],
          };

          try {
            examsResponse = await databases.listDocuments(
              examsQueryParams.databaseId,
              examsQueryParams.collectionId,
              examsQueryParams.queries
            );
            logQuery('Get Exams for Results', examsQueryParams, {
              total: examsResponse.total,
              documents: examsResponse.documents,
            });
          } catch (err) {
            logQuery('Get Exams for Results', examsQueryParams, null, err);
            throw new Error(`Failed to fetch exams: ${err.message}`);
          }
        } else {
          examsResponse = { documents: [] };
        }

        setExams(examsResponse.documents);
      } catch (err) {
        console.error('Error in fetchResultsData:', {
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString(),
        });
        setError(err.message || 'Failed to load your results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResultsData();
  }, [databaseId, studentsCollectionId, resultsCollectionId, examsCollectionId]);

  const getExamDetails = (examId) => {
    if (!examId) {
      console.warn('No examId provided');
      return null;
    }

    // Log raw examId for debugging
    console.log('Raw exam_id:', examId);

    // Handle both array and direct reference formats
    let resolvedExamId;
    if (Array.isArray(examId)) {
      resolvedExamId = examId[0]?.$id || examId[0];
    } else if (typeof examId === 'object' && examId !== null) {
      resolvedExamId = examId.$id || examId.id;
    } else {
      resolvedExamId = examId;
    }

    console.log('Resolved exam_id:', resolvedExamId);

    const exam = exams.find((e) => e.$id === resolvedExamId);
    if (!exam) {
      console.warn('Exam not found for resolved ID:', resolvedExamId);
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
        minute: '2-digit',
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Results</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading your results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Results</h1>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-medium">Error loading results:</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => {
              console.log('User clicked Try Again');
              window.location.reload();
            }}
            className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Results</h1>
        {studentInfo && (
          <p className="text-sm text-gray-600">Welcome, {studentInfo.name}</p>
        )}
      </div>

      {results.length === 0 ? (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <p>You don't have any results yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => {
            const exam = getExamDetails(result.exam_id);
            if (!exam) {
              console.warn('Skipping result - exam not found:', result);
              return null;
            }

            const percentage = result.percentage?.toFixed(1) || 0;
            const status = result.status || (percentage >= 30 ? 'passed' : 'failed');

            // Resolve exam_id for navigation
            const resolvedExamId = Array.isArray(result.exam_id)
              ? result.exam_id[0]?.$id || result.exam_id[0]
              : typeof result.exam_id === 'object' && result.exam_id !== null
              ? result.exam_id.$id || result.exam_id.id
              : result.exam_id;

            return (
              <div
                key={result.$id}
                className="p-4 border rounded-lg border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <h2 className="text-lg font-semibold text-gray-800">{exam.name}</h2>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Score:</span> {result.score}/{result.total_marks} ({percentage}%)
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>
                    <span
                      className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Time Taken:</span> {formatDuration(result.time_taken)}
                  </p>
                  <p>
                    <span className="font-medium">Completed On:</span> {formatDate(result.completed_at)}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/student/results/${resolvedExamId}`}
                    className="w-full block text-center py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultsListPage;