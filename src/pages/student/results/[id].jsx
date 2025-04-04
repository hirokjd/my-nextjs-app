import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import StudentLayout from '../../../components/StudentLayout';

const ResultDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [result, setResult] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchResultData = async () => {
      try {
        const studentSession = JSON.parse(localStorage.getItem('studentSession'));
        if (!studentSession) {
          throw new Error('Student session not found');
        }

        const results = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID,
          [
            Query.equal('exam_id', id),
            Query.equal('student_id', studentSession.$id)
          ]
        );

        if (results.documents.length === 0) {
          throw new Error('Result not found');
        }

        const resultData = results.documents[0];
        setResult(resultData);

        const examData = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
          id
        );
        setExam(examData);
      } catch (err) {
        setError(err.message || 'Failed to load result');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Exam Result</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {exam?.name}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Exam ID</h2>
              <p className="mt-1 text-gray-800">{exam?.exam_id}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Score</h2>
              <p className="mt-1 text-gray-800">
                {result?.score} / {result?.total_marks} (
                {Math.round((result?.score / result?.total_marks) * 100)}%)
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Submitted At</h2>
              <p className="mt-1 text-gray-800">{formatDate(result?.submitted_at)}</p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Details</h2>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Exam Name</h2>
              <p className="mt-1 text-gray-800">{exam?.name}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Exam Date</h2>
              <p className="mt-1 text-gray-800">{formatDate(exam?.exam_date)}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Duration</h2>
              <p className="mt-1 text-gray-800">{exam?.duration} minutes</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Description</h2>
              <p className="mt-1 text-gray-800">{exam?.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Answers</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(JSON.parse(result?.answers || '{}'), null, 2)}
          </pre>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ResultDetailsPage;