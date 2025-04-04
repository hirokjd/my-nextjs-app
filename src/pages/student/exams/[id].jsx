import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { databases, Query } from '../../../utils/appwrite';
import StudentLayout from '../../../components/StudentLayout';
import Link from 'next/link';

const ExamDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchExamData = async () => {
      try {
        const examData = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
          id
        );
        
        const examQuestions = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID,
          [Query.equal('exam_id', id)]
        );
        
        const questionIds = examQuestions.documents.map(q => q.question_id);
        const questionsData = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
          [Query.equal('$id', questionIds)]
        );

        const questionsWithMarks = questionsData.documents.map(question => {
          const examQuestion = examQuestions.documents.find(
            eq => eq.question_id === question.$id
          );
          return {
            ...question,
            marks: examQuestion?.marks || 1
          };
        });

        setExam(examData);
        setQuestions(questionsWithMarks);
      } catch (err) {
        setError('Failed to load exam data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
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

  const getExamStatus = () => {
    if (!exam) return 'loading';
    const now = new Date();
    const startTime = new Date(exam.exam_date);
    const endTime = new Date(startTime.getTime() + exam.duration * 60000);

    if (now < startTime) return 'upcoming';
    if (now >= startTime && now <= endTime) return 'ongoing';
    return 'completed';
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
          <h1 className="text-2xl font-bold text-gray-800">{exam?.name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${
            getExamStatus() === 'ongoing' ? 'bg-green-100 text-green-800' :
            getExamStatus() === 'upcoming' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {getExamStatus()}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Exam ID</h2>
              <p className="mt-1 text-gray-800">{exam?.exam_id}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Date & Time</h2>
              <p className="mt-1 text-gray-800">{formatDate(exam?.exam_date)}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Duration</h2>
              <p className="mt-1 text-gray-800">{exam?.duration} minutes</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Total Marks</h2>
              <p className="mt-1 text-gray-800">
                {questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-sm font-medium text-gray-500">Description</h2>
            <p className="mt-1 text-gray-800 whitespace-pre-line">
              {exam?.description || 'No description provided'}
            </p>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">Questions Preview</h2>
        
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.$id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-800">
                    Q{index + 1}. {question.text}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {question.marks} mark{question.marks !== 1 ? 's' : ''}
                  </span>
                </div>
                {question.options_text && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options_text.map((option, i) => (
                      <div 
                        key={i} 
                        className={`p-2 rounded text-sm ${
                          question.correct_answer === i 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No questions found for this exam</p>
        )}

        <div className="mt-6">
          {getExamStatus() === 'ongoing' ? (
            <Link
              href={`/student/exams/take/${exam.$id}`}
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Start Exam Now
            </Link>
          ) : getExamStatus() === 'upcoming' ? (
            <button
              disabled
              className="inline-block bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
            >
              Exam starts at {formatDate(exam.exam_date)}
            </button>
          ) : (
            <button
              disabled
              className="inline-block bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
            >
              Exam has ended
            </button>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default ExamDetailsPage;