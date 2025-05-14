import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import Link from 'next/link';

const ResultDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;

  useEffect(() => {
    if (!id) return;

    const fetchResultData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get student session
        const studentSession = JSON.parse(localStorage.getItem('studentSession'));
        if (!studentSession) {
          throw new Error('Student session not found');
        }

        // Query 1: Get all results and filter client-side (to handle relationship fields)
        const resultsResponse = await databases.listDocuments(
          databaseId,
          resultsCollectionId
        );

        // Find the result for this exam and student
        const studentResult = resultsResponse.documents.find(doc => {
          // Handle both direct ID and relationship object formats
          const examRef = doc.exam_id;
          const resolvedExamId = Array.isArray(examRef) 
            ? examRef[0]?.$id || examRef[0]
            : typeof examRef === 'object' 
              ? examRef.$id 
              : examRef;

          const studentRef = doc.student_id;
          const resolvedStudentId = Array.isArray(studentRef) 
            ? studentRef[0]?.$id || studentRef[0]
            : typeof studentRef === 'object' 
              ? studentRef.$id 
              : studentRef;

          return resolvedExamId === id && resolvedStudentId === studentSession.$id;
        });

        if (!studentResult) {
          throw new Error('Result not found for this exam');
        }

        setResult(studentResult);

        // Query 2: Get exam details
        const examResponse = await databases.listDocuments(
          databaseId,
          examsCollectionId,
          [Query.equal('$id', id)]
        );

        if (examResponse.total === 0) {
          throw new Error('Exam not found');
        }

        setExam(examResponse.documents[0]);
      } catch (err) {
        console.error('Error fetching result data:', err);
        setError(err.message || 'Failed to load result details');
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', dateString, err);
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading result details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-medium">Error:</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => router.push('/student/results')}
            className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (!result || !exam) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p>No result data available</p>
          <button
            onClick={() => router.push('/student/results')}
            className="mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.total_marks) * 100);
  const status = result.status || (percentage >= 30 ? 'passed' : 'failed');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/student/results">
          <a className="text-blue-600 hover:underline flex items-center">
            &larr; Back to Results
          </a>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exam Result</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* Score Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Score Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Your Score</h3>
            <p className="mt-1 text-3xl font-bold text-blue-600">
              {result.score}/{result.total_marks}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Percentage</h3>
            <p className="mt-1 text-3xl font-bold text-green-600">
              {percentage}%
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-800">Submitted At</h3>
            <p className="mt-1 text-lg text-gray-700">
              {formatDate(result.completed_at || result.attempted_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Exam Name</h3>
            <p className="mt-1 text-gray-800">{exam.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Exam ID</h3>
            <p className="mt-1 text-gray-800">{exam.exam_id || exam.$id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Exam Date</h3>
            <p className="mt-1 text-gray-800">{formatDate(exam.exam_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Duration</h3>
            <p className="mt-1 text-gray-800">{formatDuration(exam.duration)}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-gray-800">{exam.description || 'No description available'}</p>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Answers</h2>
        {result.answers ? (
          <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              {JSON.stringify(JSON.parse(result.answers), null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4">
            <p>No answer data available for this result</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDetailsPage;