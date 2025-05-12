import React, { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import Link from 'next/link';

const StudentExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
          [Query.equal('status', 'active')]
        );
        
        const examsWithStatus = response.documents.map(exam => ({
          ...exam,
          startTime: new Date(exam.exam_date),
          endTime: new Date(new Date(exam.exam_date).getTime() + exam.duration * 60000),
          status: getExamStatus(new Date(exam.exam_date), exam.duration)
        }));
        
        setExams(examsWithStatus);
      } catch (err) {
        setError('Failed to load exams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const getExamStatus = (examDate, duration) => {
    const now = new Date();
    const startTime = new Date(examDate);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Exams</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div 
              key={exam.$id}
              className={`p-4 border rounded-lg ${
                exam.status === 'ongoing' ? 'border-green-200 bg-green-50' :
                exam.status === 'upcoming' ? 'border-blue-200 bg-blue-50' :
                'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">{exam.name}</h2>
                  <p className="text-sm text-gray-600">{exam.exam_id}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  exam.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                  exam.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {exam.status}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-gray-600">
                <p>Date: {formatDate(exam.exam_date)}</p>
                <p>Duration: {exam.duration} minutes</p>
              </div>
              
              <div className="mt-3 flex space-x-2">
                <Link
                  href={`/student/exams/${exam.$id}`}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                >
                  View Details
                </Link>
                {exam.status === 'ongoing' && (
                  <Link
                    href={`/student/exams/take/${exam.$id}`}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                  >
                    Start Exam
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentExamsPage;
