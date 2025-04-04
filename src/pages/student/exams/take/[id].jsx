import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { databases, Query, ID } from '../../../utils/appwrite';
import StudentLayout from '../../../components/StudentLayout';

const TakeExamPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

        const questionsWithDetails = questionsData.documents.map(question => {
          const examQuestion = examQuestions.documents.find(
            eq => eq.question_id === question.$id
          );
          return {
            ...question,
            marks: examQuestion?.marks || 1,
            order: examQuestion?.order || 0
          };
        }).sort((a, b) => a.order - b.order);

        const initialAnswers = {};
        questionsWithDetails.forEach(q => {
          initialAnswers[q.$id] = null;
        });

        const endTime = new Date(examData.exam_date).getTime() + examData.duration * 60000;
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 60000));

        setExam(examData);
        setQuestions(questionsWithDetails);
        setAnswers(initialAnswers);
        setTimeLeft(remaining);
      } catch (err) {
        setError('Failed to load exam data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [id]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const studentSession = JSON.parse(localStorage.getItem('studentSession'));
      if (!studentSession) {
        throw new Error('Student session not found');
      }

      let score = 0;
      questions.forEach(question => {
        if (question.correct_answer === answers[question.$id]) {
          score += question.marks || 1;
        }
      });

      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID,
        ID.unique(),
        {
          exam_id: id,
          student_id: studentSession.$id,
          student_name: studentSession.name,
          score,
          total_marks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
          answers: JSON.stringify(answers),
          submitted_at: new Date().toISOString()
        }
      );

      router.push(`/student/results/${id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
            Time Left: {timeLeft} minute{timeLeft !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Exam ID</h2>
              <p className="mt-1 text-gray-800">{exam?.exam_id}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Duration</h2>
              <p className="mt-1 text-gray-800">{exam?.duration} minutes</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.$id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium text-gray-800">
                  Question {index + 1} ({question.marks} mark{question.marks !== 1 ? 's' : ''})
                </h2>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {question.difficulty}
                </span>
              </div>

              <p className="mb-4 text-gray-800">{question.text}</p>

              {question.type === 'mcq' && question.options_text && (
                <div className="space-y-2">
                  {question.options_text.map((option, i) => (
                    <div key={i} className="flex items-center">
                      <input
                        type="radio"
                        id={`q${question.$id}-opt${i}`}
                        name={`q${question.$id}`}
                        checked={answers[question.$id] === i}
                        onChange={() => handleAnswerChange(question.$id, i)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={`q${question.$id}-opt${i}`} className="ml-2 block text-sm text-gray-700">
                        {String.fromCharCode(65 + i)}. {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <textarea
                  value={answers[question.$id] || ''}
                  onChange={(e) => handleAnswerChange(question.$id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Type your answer here..."
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </StudentLayout>
  );
};

export default TakeExamPage;