import React, { useState, useEffect } from 'react';
import { databases, storage, Query } from '../../../utils/appwrite';
import { getCurrentStudentSession } from '../../../utils/auth';
import { useRouter } from 'next/router';

const BUCKET_ID = 'questions';
const QUERY_TIMEOUT = 10000; // 10 seconds timeout for queries

const ExamResponsesPage = () => {
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [calculatedResult, setCalculatedResult] = useState(null);
  const router = useRouter();
  const { id: examIdRaw } = router.query;

  // Normalize examId to ensure it's a valid string
  const examId = examIdRaw && typeof examIdRaw === 'string' && examIdRaw !== '[object Object]'
    ? examIdRaw
    : null;

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const examQuestionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;
  const questionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
  const responsesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;

  // Helper to resolve relationship IDs
  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field?.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    if (typeof field === 'string') return field;
    console.warn('Unexpected relationship field format:', field);
    return null;
  };

  // Fetch image URL from Appwrite storage
  const getFileUrl = async (fileId) => {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Error fetching image:', error.message);
      return null;
    }
  };

  // Fetch question order from exam_questions
  const getQuestionOrder = (questionId) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = resolveRelationshipId(qRef);
      return refId === questionId;
    });
    return mapping?.order || 'N/A';
  };

  // Fetch question marks from exam_questions
  const getQuestionMarks = (questionId) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = resolveRelationshipId(qRef);
      return refId === questionId;
    });
    return mapping?.marks || 0;
  };

  // Format date for display
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

  // Format duration for display
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate result based on responses and questions
  const calculateResult = () => {
    let score = 0;
    let totalMarks = 0;

    // Calculate total possible marks and actual score
    examQuestions.forEach(eq => {
      const questionId = resolveRelationshipId(eq.question_id);
      const marks = parseInt(eq.marks) || 0;
      totalMarks += marks;

      const question = questions.find(q => q.$id === questionId);
      const response = responses.find(r => resolveRelationshipId(r.question_id) === questionId);

      if (question && response) {
        const selectedOption = parseInt(response.selected_option);
        const correctOption = question.correct_answer !== undefined ? parseInt(question.correct_answer) : null;

        if (correctOption !== null && selectedOption === correctOption) {
          score += marks;
        }
      }
    });

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const status = result?.status || (percentage >= 30 ? 'passed' : 'failed');

    return {
      score,
      total_marks: totalMarks,
      percentage: parseFloat(percentage.toFixed(1)),
      status,
      time_taken: result?.time_taken || 0,
      attempted_at: result?.attempted_at || new Date().toISOString(),
      completed_at: result?.completed_at || new Date().toISOString()
    };
  };

  // Fetch exam responses and related data
  useEffect(() => {
    let timeoutId;
    const fetchResponseData = async () => {
      // Set timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        setError('Request timed out. Please check your network or try again.');
        setLoading(false);
        router.push('/student/exams');
      }, QUERY_TIMEOUT);

      // Validate examId
      if (!examId) {
        clearTimeout(timeoutId);
        setError('Invalid exam ID. Please select an exam from the results list.');
        setLoading(false);
        return;
      }

      // Validate environment variables
      if (
        !databaseId ||
        !studentsCollectionId ||
        !examsCollectionId ||
        !examQuestionsCollectionId ||
        !questionsCollectionId ||
        !responsesCollectionId ||
        !resultsCollectionId
      ) {
        clearTimeout(timeoutId);
        setError('System configuration error. Please contact your administrator.');
        setLoading(false);
        return;
      }

      try {
        // Validate session
        const session = await getCurrentStudentSession();
        if (!session?.email) {
          clearTimeout(timeoutId);
          console.warn('No valid session found, redirecting to login');
          router.push('/login');
          return;
        }

        // Query 1: Fetch student by email
        const studentResponse = await databases.listDocuments(
          databaseId,
          studentsCollectionId,
          [Query.equal('email', session.email)]
        );

        if (studentResponse.total === 0) {
          throw new Error('Student record not found');
        }

        const student = studentResponse.documents[0];
        setStudentInfo({
          name: student.name,
          email: student.email,
          studentId: student.$id,
        });

        // Query 2: Fetch exam details
        const examResponse = await databases.listDocuments(
          databaseId,
          examsCollectionId,
          [Query.equal('$id', examId)]
        );

        if (examResponse.total === 0) {
          throw new Error(`Exam with ID ${examId} not found. Please check if the exam exists.`);
        }

        setExam(examResponse.documents[0]);

        // Query 3: Fetch exam questions
        const examQuestionsResponse = await databases.listDocuments(
          databaseId,
          examQuestionsCollectionId,
          [Query.orderAsc('order')]
        );

        const filteredExamQuestions = examQuestionsResponse.documents.filter(doc => {
          const examRef = doc.exam_id;
          const refId = resolveRelationshipId(examRef);
          return refId === examId;
        });

        setExamQuestions(filteredExamQuestions);

        // Query 4: Fetch student responses
        const responsesResponse = await databases.listDocuments(
          databaseId,
          responsesCollectionId,
          [
            Query.equal('student_id', student.$id),
            Query.equal('exam_id', examId),
          ]
        );

        setResponses(responsesResponse.documents);

        // Query 5: Fetch questions
        const questionIds = responsesResponse.documents
          .map((res) => resolveRelationshipId(res.question_id))
          .filter((id) => id);

        if (questionIds.length > 0) {
          const questionsResponse = await databases.listDocuments(
            databaseId,
            questionsCollectionId,
            [Query.contains('$id', questionIds), Query.limit(100)]
          );

          const updatedQuestions = await Promise.all(
            questionsResponse.documents.map(async (q) => ({
              ...q,
              imageUrl: q.image_id ? await getFileUrl(q.image_id) : null,
              optionsImageUrls: await Promise.all(
                (q.options_image || []).map(async (imgId) => (imgId ? await getFileUrl(imgId) : null))
              ),
            }))
          );

          setQuestions(updatedQuestions);
        }

        // Query 6: Fetch result from database
        const resultResponse = await databases.listDocuments(
          databaseId,
          resultsCollectionId,
          [
            Query.equal('student_id', student.$id),
            Query.equal('exam_id', examId),
          ]
        );

        if (resultResponse.total > 0) {
          setResult(resultResponse.documents[0]);
        } else {
          console.warn('No result found for student_id:', student.$id, 'and exam_id:', examId);
          setResult(null);
        }

        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error in fetchResponseData:', {
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString(),
        });
        setError(err.message || 'Failed to load responses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResponseData();
  }, [examId, router]);

  // Calculate the result whenever questions, responses, or examQuestions change
  useEffect(() => {
    if (questions.length > 0 && responses.length > 0 && examQuestions.length > 0) {
      const calculated = calculateResult();
      setCalculatedResult(calculated);
    }
  }, [questions, responses, examQuestions, result]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading responses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-medium">Error loading responses:</p>
          <p className="mt-1">{error}</p>
          <p className="mt-1 text-sm">If this is a permissions issue, please contact your administrator.</p>
          <button
            onClick={() => router.push('/student/exams')}
            className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Return to Exams
          </button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p>Exam details not found.</p>
          <button
            onClick={() => router.push('/student/exams')}
            className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Return to Exams
          </button>
        </div>
      </div>
    );
  }

  // Use calculated result if available, otherwise fall back to stored result
  const displayResult = calculatedResult || result;

  return (
    <div className="container mx-auto px-4 py-6 select-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{exam.name} - Responses</h1>
          <p className="text-sm text-gray-600">
            {studentInfo && `Student: ${studentInfo.name} (${studentInfo.email})`}
          </p>
        </div>
        <button
          onClick={() => router.push('/student/exams')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Exams
        </button>
      </div>

      {/* Result Summary */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Result Summary</h2>
        {displayResult ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-lg font-semibold">{displayResult.score}/{displayResult.total_marks}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Percentage</p>
              <p className="text-lg font-semibold">{displayResult.percentage}%</p>
            </div>
            <div className={`p-4 rounded-lg ${
              displayResult.status === 'passed' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold capitalize">{displayResult.status}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Time Taken</p>
              <p className="text-lg font-semibold">{formatDuration(displayResult.time_taken)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Attempted At</p>
              <p className="text-lg font-semibold">
                {formatDate(displayResult.attempted_at)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Completed At</p>
              <p className="text-lg font-semibold">
                {formatDate(displayResult.completed_at)}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
            <p>No result found for this exam. Please contact your administrator.</p>
          </div>
        )}
      </div>

      {/* Responses */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Your Responses</h2>
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No responses found for this exam.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response) => {
              const questionId = resolveRelationshipId(response.question_id);
              const question = questions.find((q) => q.$id === questionId);
              if (!question) {
                return (
                  <div key={response.$id} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">Question data not found for response {response.$id}</p>
                  </div>
                );
              }

              const isCorrect = parseInt(response.selected_option) === parseInt(question.correct_answer);
              const questionMarks = getQuestionMarks(questionId);
              const questionOrder = getQuestionOrder(questionId);

              return (
                <div key={response.$id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">
                        Question {questionOrder} (Marks: {questionMarks})
                      </h3>
                      {question.text && (
                        <p className="text-gray-700 mt-2">{question.text}</p>
                      )}
                      {question.imageUrl && (
                        <img
                          src={question.imageUrl}
                          alt="Question"
                          className="mt-3 max-h-80 w-full object-contain border rounded-lg"
                        />
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {question.difficulty && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Difficulty: {question.difficulty}
                          </span>
                        )}
                        {question.tags && Array.isArray(question.tags) && question.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Tag: {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        ID: {question.$id}
                      </span>
                      {question.question_id && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Question ID: {question.question_id}
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          isCorrect
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                      {isCorrect && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          +{questionMarks} marks
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options_text.map((option, optIndex) => {
                      const isSelected = parseInt(response.selected_option) === optIndex;
                      const isCorrectOption = parseInt(question.correct_answer) === optIndex;
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 border rounded-lg ${
                            isSelected && isCorrectOption
                              ? 'border-green-500 bg-green-50'
                              : isSelected
                              ? 'border-red-500 bg-red-50'
                              : isCorrectOption
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start">
                            <span className="mt-1 h-5 w-5 inline-block mr-2">
                              {isSelected && isCorrectOption && (
                                <svg
                                  className="h-5 w-5 text-green-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                              {isSelected && !isCorrectOption && (
                                <svg
                                  className="h-5 w-5 text-red-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              {!isSelected && isCorrectOption && (
                                <svg
                                  className="h-5 w-5 text-green-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </span>
                            <div className="flex-1">
                              {option && <p className="text-gray-700">{option}</p>}
                              {question.optionsImageUrls?.[optIndex] && (
                                <img
                                  src={question.optionsImageUrls[optIndex]}
                                  alt={`Option ${optIndex + 1}`}
                                  className="mt-2 max-h-40 w-full object-contain"
                                />
                              )}
                              {isCorrectOption && (
                                <p className="text-sm font-bold text-green-600 mt-1">Correct Answer</p>
                              )}
                              {isSelected && !isCorrectOption && (
                                <p className="text-sm text-red-600 mt-1">Your Answer</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResponsesPage;