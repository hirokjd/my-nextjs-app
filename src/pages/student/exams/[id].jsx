import React, { useState, useEffect, useCallback } from 'react';
import { databases, storage, Query, ID } from '../../../utils/appwrite';
import { getCurrentStudentSession } from '../../../utils/auth';
import { useRouter } from 'next/router';

const BUCKET_ID = 'questions';
const MAX_TAB_SWITCHES = 3;

const ExamTakingPage = () => {
  const [exam, setExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  const router = useRouter();
  const { id: examId } = router.query;

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const examQuestionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;
  const questionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const responsesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;

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
      projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
    });
  }, []);

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

  const getFileUrl = async (fileId) => {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Error fetching image:', error.message);
      return null;
    }
  };

  const generateResultId = (examId, studentId) => {
    const shortExamId = examId.substring(0, 10);
    const shortStudentId = studentId.substring(0, 10);
    const timestamp = Date.now().toString(36).substring(0, 6);
    const random = Math.random().toString(36).substring(2, 6);
    return `res_${shortExamId}_${shortStudentId}_${timestamp}_${random}`.substring(0, 36);
  };

  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    return field;
  };

  useEffect(() => {
    const preventCopyPaste = (e) => {
      e.preventDefault();
      alert('Copying and pasting are disabled during the exam.');
    };

    const preventRightClick = (e) => {
      e.preventDefault();
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('contextmenu', preventRightClick);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('contextmenu', preventRightClick);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            alert(`Warning: Maximum tab switches (${MAX_TAB_SWITCHES}) reached. Please remain on the exam page.`);
          } else {
            alert(`Warning: Tab switch detected (${newCount}/${MAX_TAB_SWITCHES}).`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const toggleFullScreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
      }
    } catch (err) {
      console.error('Full-screen error:', err.message);
      setError('Failed to toggle full-screen mode. Please try again or continue without full-screen.');
    }
  }, []);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) {
        setError('No exam ID provided');
        setLoading(false);
        return;
      }

      if (!databaseId || !studentsCollectionId || !examsCollectionId || !examQuestionsCollectionId || !questionsCollectionId || !responsesCollectionId || !resultsCollectionId) {
        setError('Missing required environment variables. Please contact your administrator.');
        setLoading(false);
        return;
      }

      try {
        setExamStartTime(new Date().toISOString());
        const session = await getCurrentStudentSession();
        console.log('Session:', session);
        if (!session?.email) {
          console.warn('No valid session found, redirecting to login');
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

        const examQueryParams = {
          databaseId,
          collectionId: examsCollectionId,
          queries: [Query.equal('$id', examId)]
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
            documents: examResponse.documents
          });
        } catch (err) {
          logQuery('Get Exam', examQueryParams, null, err);
          throw new Error(`Exam query failed: ${err.message}. Check permissions for exams collection.`);
        }

        if (examResponse.total === 0) {
          throw new Error('Exam not found');
        }

        const examData = examResponse.documents[0];
        setExam(examData);
        setTimeRemaining(examData.duration * 60);

        const examQuestionsQueryParams = {
          databaseId,
          collectionId: examQuestionsCollectionId,
          queries: [Query.orderAsc('order')]
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
            documents: examQuestionsResponse.documents
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

        const questionIds = filteredExamQuestions.map(eq => resolveRelationshipId(eq.question_id)).filter(id => id);

        if (questionIds.length > 0) {
          const questionsQueryParams = {
            databaseId,
            collectionId: questionsCollectionId,
            queries: [Query.limit(100)]
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
              documents: questionsResponse.documents
            });
          } catch (err) {
            logQuery('Get Questions', questionsQueryParams, null, err);
            throw new Error(`Questions query failed: ${err.message}. Check permissions for questions collection.`);
          }

          const updatedQuestions = await Promise.all(
            questionsResponse.documents
              .filter(q => questionIds.includes(q.$id) || questionIds.includes(q.question_id))
              .map(async (q) => ({
                ...q,
                imageUrl: q.image_id ? await getFileUrl(q.image_id) : null,
                optionsImageUrls: await Promise.all(
                  (q.options_image || []).map(async (imgId) => 
                    imgId ? await getFileUrl(imgId) : null
                  )
                )
              }))
          );

          setQuestions(updatedQuestions);
        }
      } catch (err) {
        console.error('Error in fetchExamData:', {
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        });
        setError(err.message || 'Failed to load exam. Please check your permissions or try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId, router]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const getQuestionById = (questionId) => {
    return questions.find(q => q.$id === questionId) || 
           questions.find(q => q.question_id === questionId);
  };

  const getQuestionMarks = (questionId) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const qRefId = resolveRelationshipId(qRef);
      return qRefId === questionId;
    });
    return mapping?.marks || 0;
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  const handleMarkForReview = (questionId) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleSkip = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const calculateResult = async () => {
    let score = 0;
    let total_marks = 0;

    console.group('Result Calculation Debug');
    console.log('Exam Questions:', examQuestions.map(eq => ({
      $id: eq.$id,
      question_id: resolveRelationshipId(eq.question_id),
      marks: eq.marks,
      order: eq.order
    })));
    console.log('Questions:', questions.map(q => ({
      $id: q.$id,
      question_id: q.question_id,
      text: q.text?.substring(0, 50),
      correct_answer: q.correct_answer
    })));
    console.log('Answers:', answers);

    for (const eq of examQuestions) {
      const questionId = resolveRelationshipId(eq.question_id);
      const marks = parseInt(eq.marks) || 0;
      total_marks += marks;

      const question = getQuestionById(questionId);
      if (question && answers[questionId] !== undefined) {
        const selectedOption = parseInt(answers[questionId]);
        const correctOption = question.correct_answer !== undefined ? parseInt(question.correct_answer) : null;

        console.log(`Question ${questionId}:`, {
          selectedOption,
          correctOption,
          marks,
          hasCorrectOption: correctOption !== null
        });

        if (correctOption !== null && selectedOption === correctOption) {
          score += marks;
        } else if (correctOption === null) {
          console.warn(`Question ${questionId} missing correct_answer, awarding 0 marks`);
        }
      } else {
        console.log(`Question ${questionId}: No answer or question not found`);
      }
    }

    const percentage = total_marks > 0 ? (score / total_marks) * 100 : 0;
    const status = percentage >= 30 ? 'passed' : 'failed';

    console.log('Final Result:', { score, total_marks, percentage: percentage.toFixed(1), status });
    console.groupEnd();

    return { score, total_marks, percentage, status };
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Are you sure you want to submit the exam?')) {
      return;
    }

    try {
      if (!databaseId || !responsesCollectionId || !resultsCollectionId) {
        throw new Error('Missing required environment variables for submission.');
      }

      const endTime = new Date();
      const startTime = new Date(examStartTime);
      const timeTakenMinutes = autoSubmit ? (exam.duration || 60) : Math.round((endTime - startTime) / (1000 * 60));

      const responsePromises = Object.entries(answers).map(async ([questionId, selectedOption]) => {
        const responseData = {
          response_id: ID.unique(),
          student_id: studentInfo.studentId,
          exam_id: examId,
          question_id: questionId,
          selected_option: parseInt(selectedOption)
        };

        try {
          const response = await databases.createDocument(
            databaseId,
            responsesCollectionId,
            ID.unique(),
            responseData
          );
          logQuery('Submit Response', { databaseId, collectionId: responsesCollectionId, responseData }, response);
          return response;
        } catch (err) {
          logQuery('Submit Response', { databaseId, collectionId: responsesCollectionId, responseData }, null, err);
          throw new Error(`Failed to submit response for question ${questionId}: ${err.message}`);
        }
      });

      await Promise.all(responsePromises);

      const { score, total_marks, percentage, status } = await calculateResult();
      const resultId = generateResultId(examId, studentInfo.studentId);
      const resultData = {
        result_id: resultId,
        student_id: studentInfo.studentId,
        exam_id: examId,
        score: parseInt(score),
        total_marks: parseInt(total_marks),
        percentage: parseFloat(percentage.toFixed(1)),
        status,
        time_taken: parseInt(timeTakenMinutes),
        attempted_at: startTime.toISOString(),
        completed_at: endTime.toISOString(),
        created_at: endTime.toISOString()
      };

      try {
        const result = await databases.createDocument(
          databaseId,
          resultsCollectionId,
          ID.unique(),
          resultData
        );
        logQuery('Submit Result', { databaseId, collectionId: resultsCollectionId, resultData }, result);
      } catch (err) {
        logQuery('Submit Result', { databaseId, collectionId: resultsCollectionId, resultData }, null, err);
        throw new Error(`Failed to submit result: ${err.message}`);
      }

      router.push('/student/exams?submitted=true');
    } catch (err) {
      console.error('Error submitting exam:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || 'Failed to submit exam. Please try again or contact your administrator.');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const answeredCount = Object.keys(answers).length;
  const markedCount = Object.values(markedForReview).filter(v => v).length;
  const notVisitedCount = questions.length - answeredCount - markedCount;
  const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading exam...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-medium">Error loading exam:</p>
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

  if (!exam || exam.status !== 'active') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p>This exam is not currently available.</p>
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

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-6 select-none">
      {showSubmitConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit the exam? You cannot make changes after submission.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleSubmit();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{exam.name}</h1>
          <p className="text-sm text-gray-600">
            {studentInfo && `Student: ${studentInfo.name} (${studentInfo.email})`}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-red-600">
            Time Remaining: {formatTime(timeRemaining)}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Progress: {answeredCount}/{questions.length} questions answered
        </p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Current Question</h2>
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No questions found for this exam.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentQuestion && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {currentQuestion.text && (
                          <p className="text-gray-700 mt-2">{currentQuestion.text}</p>
                        )}
                        {currentQuestion.imageUrl && (
                          <img
                            src={currentQuestion.imageUrl}
                            alt="Question"
                            className="mt-3 max-h-80 w-full object-contain border rounded-lg"
                          />
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {currentQuestion.difficulty && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Difficulty: {currentQuestion.difficulty}
                            </span>
                          )}
                          {currentQuestion.tags && Array.isArray(currentQuestion.tags) && currentQuestion.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Tag: {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          Marks: {getQuestionMarks(currentQuestion.$id)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentQuestion.options_text.map((option, index) => (
                        <label
                          key={index}
                          className={`flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            answers[currentQuestion.$id] === index
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.$id}`}
                            checked={answers[currentQuestion.$id] === index}
                            onChange={() => handleAnswerChange(currentQuestion.$id, index)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3 flex-1">
                            {option && <p className="text-gray-700">{option}</p>}
                            {currentQuestion.optionsImageUrls?.[index] && (
                              <img
                                src={currentQuestion.optionsImageUrls[index]}
                                alt={`Option ${index + 1}`}
                                className="mt-2 max-h-40 w-full object-contain"
                              />
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleMarkForReview(currentQuestion.$id)}
                        className={`py-2 px-4 rounded-md text-white ${
                          markedForReview[currentQuestion.$id]
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-yellow-500 hover:bg-yellow-600'
                        }`}
                      >
                        {markedForReview[currentQuestion.$id] ? 'Unmark Review' : 'Mark for Review'}
                      </button>
                      <button
                        onClick={handleSkip}
                        className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className={`py-2 px-4 rounded-md text-white ${
                      currentQuestionIndex === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex gap-3">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      >
                        Next
                      </button>
                    ) : null}
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md"
                    >
                      Submit Exam
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="w-80">
          <div className="bg-white p-4 rounded-lg shadow sticky top-4">
            <h3 className="font-semibold mb-4">Question Palette</h3>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700">Progress</h4>
              <div className="mt-2 text-sm">
                <p>Answered: {answeredCount}</p>
                <p>Marked for Review: {markedCount}</p>
                <p>Not Visited: {notVisitedCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers[q.$id] !== undefined;
                const isMarked = markedForReview[q.$id];
                return (
                  <button
                    key={q.$id}
                    onClick={() => handleJumpToQuestion(index)}
                    className={`p-2 rounded text-white text-sm ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600'
                        : isAnswered
                        ? 'bg-green-500'
                        : isMarked
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                    title={`Question ${index + 1}: ${
                      index === currentQuestionIndex
                        ? 'Current'
                        : isAnswered
                        ? 'Answered'
                        : isMarked
                        ? 'Marked for Review'
                        : 'Not Visited'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTakingPage;