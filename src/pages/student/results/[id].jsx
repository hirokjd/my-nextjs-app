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

  // Log environment variables and router query for debugging
  useEffect(() => {
    console.log('Environment Variables:', {
      databaseId,
      studentsCollectionId,
      examsCollectionId,
      examQuestionsCollectionId,
      questionsCollectionId,
      responsesCollectionId,
      resultsCollectionId,
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    });
    console.log('Router Query:', router.query);
    console.log('Raw Exam ID:', examIdRaw);
    console.log('Normalized Exam ID:', examId);
  }, [examIdRaw, router.query]);

  // Helper to log Appwrite queries
  const logQuery = (queryName, params, result, error = null) => {
    console.groupCollapsed(`Query: ${queryName}`);
    console.log('Params:', params);
    if (error) {
      console.error('Error:', error.message, 'Code:', error.code, 'Type:', error.type);
    } else {
      console.log('Result:', result);
    }
    console.groupEnd();
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

  // Resolve Appwrite relationship IDs
  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field?.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    if (typeof field === 'string') return field;
    console.warn('Unexpected relationship field format:', field);
    return null;
  };

  // Fetch question order from exam_questions
  const getQuestionOrder = (questionId, examQuestions) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = resolveRelationshipId(qRef);
      return refId === questionId;
    });
    return mapping?.order || 'N/A';
  };

  // Fetch question marks from exam_questions
  const getQuestionMarks = (questionId, examQuestions) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = resolveRelationshipId(qRef);
      return refId === questionId;
    });
    return mapping?.marks || 0;
  };

  // Fetch exam responses and related data
  const [examQuestions, setExamQuestions] = useState([]);
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
        console.log('Session:', session);
        if (!session?.email) {
          clearTimeout(timeoutId);
          console.warn('No valid session found, redirecting to login');
          router.push('/login');
          return;
        }

        // Query 1: Fetch student by email
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
          throw new Error(`Student query failed: ${err.message}. Check permissions for students collection.`);
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

        // Query 2: Fetch exam details
        const examQueryParams = {
          databaseId,
          collectionId: examsCollectionId,
          queries: [Query.equal('$id', examId)],
        };

        let examResponse;
        try {
          examResponse = await databases.listDocuments(
            examQueryParams.databaseId,
            examQueryParams.collectionId,
            examQueryParams.queries
          );
          logQuery('Get Exam', examQueryParams, {
            total: examResponse.total,
            documents: examResponse.documents,
          });
        } catch (err) {
          logQuery('Get Exam', examQueryParams, null, err);
          throw new Error(`Exam query failed: ${err.message}. Check permissions for exams collection or verify exam ID: ${examId}`);
        }

        if (examResponse.total === 0) {
          throw new Error(`Exam with ID ${examId} not found. Please check if the exam exists.`);
        }

        setExam(examResponse.documents[0]);

        // Query 3: Fetch exam questions
        const examQuestionsQueryParams = {
          databaseId,
          collectionId: examQuestionsCollectionId,
          queries: [Query.orderAsc('order')],
        };

        let examQuestionsResponse;
        try {
          examQuestionsResponse = await databases.listDocuments(
            examQuestionsQueryParams.databaseId,
            examQuestionsQueryParams.collectionId,
            examQuestionsQueryParams.queries
          );
          logQuery('Get Exam Questions', examQuestionsQueryParams, {
            total: examQuestionsResponse.total,
            documents: examQuestionsResponse.documents,
          });
        } catch (err) {
          logQuery('Get Exam Questions', examQuestionsQueryParams, null, err);
          throw new Error(`Exam questions query failed: ${err.message}. Check permissions for exam_questions collection.`);
        }

        const filteredExamQuestions = examQuestionsResponse.documents.filter(doc => {
          const examRef = doc.exam_id;
          if (Array.isArray(examRef)) {
            return examRef.some(ref => ref.$id === examId || ref === examId);
          } else if (typeof examRef === 'object' && examRef !== null) {
            return examRef.$id === examId;
          }
          return examRef === examId;
        });

        setExamQuestions(filteredExamQuestions);

        // Query 4: Fetch student responses
        const responsesQueryParams = {
          databaseId,
          collectionId: responsesCollectionId,
          queries: [
            Query.equal('student_id', student.$id),
            Query.equal('exam_id', examId),
          ],
        };

        let responsesResponse;
        try {
          responsesResponse = await databases.listDocuments(
            responsesQueryParams.databaseId,
            responsesQueryParams.collectionId,
            responsesQueryParams.queries
          );
          logQuery('Get Responses', responsesQueryParams, {
            total: responsesResponse.total,
            documents: responsesResponse.documents,
          });
        } catch (err) {
          logQuery('Get Responses', responsesQueryParams, null, err);
          throw new Error(`Responses query failed: ${err.message}. Check permissions for responses collection.`);
        }

        setResponses(responsesResponse.documents);

        // Query 5: Fetch questions
        const questionIds = responsesResponse.documents
          .map((res) => resolveRelationshipId(res.question_id))
          .filter((id) => id);

        if (questionIds.length > 0) {
          const questionsQueryParams = {
            databaseId,
            collectionId: questionsCollectionId,
            queries: [Query.contains('$id', questionIds), Query.limit(100)],
          };

          let questionsResponse;
          try {
            questionsResponse = await databases.listDocuments(
              questionsQueryParams.databaseId,
              questionsQueryParams.collectionId,
              questionsQueryParams.queries
            );
            logQuery('Get Questions', questionsQueryParams, {
              total: questionsResponse.total,
              documents: questionsResponse.documents,
            });
          } catch (err) {
            logQuery('Get Questions', questionsQueryParams, null, err);
            throw new Error(`Questions query failed: ${err.message}. Check permissions for questions collection.`);
          }

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

        // Query 6: Fetch result
        const resultQueryParams = {
          databaseId,
          collectionId: resultsCollectionId,
          queries: [
            Query.equal('student_id', student.$id),
            Query.equal('exam_id', examId),
          ],
        };

        let resultResponse;
        try {
          resultResponse = await databases.listDocuments(
            resultQueryParams.databaseId,
            resultQueryParams.collectionId,
            resultQueryParams.queries
          );
          logQuery('Get Result', resultQueryParams, {
            total: resultResponse.total,
            documents: resultResponse.documents,
          });
        } catch (err) {
          logQuery('Get Result', resultQueryParams, null, err);
          throw new Error(`Result query failed: ${err.message}. Check permissions for results collection.`);
        }

        if (resultResponse.total > 0) {
          setResult(resultResponse.documents[0]);
          console.log('Result Document:', resultResponse.documents[0]);
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

    // Cleanup timeout on unmount
    return () => clearTimeout(timeoutId);
  }, [examId, router]);

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
        {result ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-lg font-semibold">{result.score}/{result.total_marks}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Percentage</p>
              <p className="text-lg font-semibold">{result.percentage.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold capitalize">{result.status}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Time Taken</p>
              <p className="text-lg font-semibold">{result.time_taken} minutes</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Attempted At</p>
              <p className="text-lg font-semibold">
                {new Date(result.attempted_at).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Completed At</p>
              <p className="text-lg font-semibold">
                {new Date(result.completed_at).toLocaleString()}
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
            {responses.map((response, index) => {
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
              return (
                <div key={response.$id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">
                        Question {getQuestionOrder(question.$id, examQuestions)} (Marks: {getQuestionMarks(question.$id, examQuestions)})
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