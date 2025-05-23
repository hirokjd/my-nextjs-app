import React, { useState, useEffect } from 'react';
import { databases, storage, Query } from '../../utils/appwrite';
import { Eye } from 'lucide-react';

const BUCKET_ID = 'questions';

const ResultsAnalysisPage = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState(null);

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

  // Fetch all initial data (results, students, exams)
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resultsResponse, studentsResponse, examsResponse] = await Promise.all([
        databases.listDocuments(databaseId, resultsCollectionId),
        databases.listDocuments(databaseId, studentsCollectionId),
        databases.listDocuments(databaseId, examsCollectionId)
      ]);

      const studentMap = new Map();
      studentsResponse.documents.forEach(student => {
        studentMap.set(student.$id, student);
        if (student.student_id) {
          studentMap.set(student.student_id, student);
        }
      });

      const examMap = new Map();
      examsResponse.documents.forEach(exam => {
        examMap.set(exam.$id, exam);
        if (exam.exam_id) {
          examMap.set(exam.exam_id, exam);
        }
      });

      const normalizedResults = resultsResponse.documents.map(result => {
        const student = studentMap.get(result.student_id) || 
                       studentMap.get(result.student_id?.$id);
        const exam = examMap.get(result.exam_id) || 
                    examMap.get(result.exam_id?.$id);

        return {
          ...result,
          studentName: student ? student.name : 'Unknown Student',
          studentEmail: student ? student.email : '',
          studentId: student?.$id || result.student_id,
          examName: exam ? exam.name : 'Unknown Exam',
          examId: exam?.$id || result.exam_id,
          examDescription: exam?.description || 'No description available',
          percentage: result.percentage || (result.score / result.total_marks * 100),
          status: result.status || (result.percentage >= 30 ? 'passed' : 'failed'),
          createdDate: result.$createdAt ? new Date(result.$createdAt).toLocaleDateString() : 'N/A'
        };
      });

      setResults(normalizedResults);
      setStudents(studentsResponse.documents);
      setExams(examsResponse.documents);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch response data when viewing a result
  const fetchResponseData = async (result) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch exam questions
      const examQuestionsResponse = await databases.listDocuments(
        databaseId,
        examQuestionsCollectionId,
        [Query.orderAsc('order')]
      );

      const filteredExamQuestions = examQuestionsResponse.documents.filter(doc => {
        const examRef = doc.exam_id;
        const refId = resolveRelationshipId(examRef);
        return refId === result.examId;
      });

      setExamQuestions(filteredExamQuestions);

      // Fetch responses
      const responsesResponse = await databases.listDocuments(
        databaseId,
        responsesCollectionId,
        [
          Query.equal('student_id', result.studentId),
          Query.equal('exam_id', result.examId),
        ]
      );

      setResponses(responsesResponse.documents);

      // Fetch questions
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
    } catch (err) {
      setError(err.message || 'Failed to load response details.');
      console.error('Error fetching response data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle view button click
  const handleView = (result) => {
    setViewingResult(result);
    setViewModalOpen(true);
    fetchResponseData(result);
  };

  // Close view modal
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingResult(null);
    setResponses([]);
    setQuestions([]);
    setExamQuestions([]);
  };

  // Filter results based on search and filters
  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.examName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'All' ||
      (statusFilter === 'Pass' && result.status === 'passed') ||
      (statusFilter === 'Fail' && result.status === 'failed');

    const matchesExam = 
      examFilter === 'All' ||
      result.examId === examFilter;

    return matchesSearch && matchesStatus && matchesExam;
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const ActionButtons = ({ result }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600 transition-colors"
        onClick={() => handleView(result)}
        title="View"
        aria-label="View result"
      >
        <Eye size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Exam Results Analysis</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded mb-2 sm:mb-0 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          onClick={fetchAllData}
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by student or exam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded flex-grow max-w-xl"
          />

          <div className="flex gap-4">
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="border px-4 py-2 rounded min-w-[180px]"
            >
              <option value="All">All Exams</option>
              {exams.map(exam => (
                <option key={exam.$id} value={exam.$id}>
                  {exam.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="All">All Statuses</option>
              <option value="Pass">Passed</option>
              <option value="Fail">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {loading && !viewModalOpen ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading results...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Exam
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.$id}>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm font-medium text-gray-900">
                        {result.studentName}
                        <div className="text-xs text-gray-500 sm:hidden">{result.examName}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden sm:table-cell">
                        {result.examName}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500">
                        {result.score}/{result.total_marks} ({result.percentage?.toFixed(1)}%)
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden sm:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          result.status === 'passed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden md:table-cell">
                        {result.createdDate}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500">
                        <ActionButtons result={result} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filteredResults.length === 0 && !loading && (
        <div className="text-center py-8">
          <p>No results found matching your criteria</p>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && viewingResult && (
        <div className="fixed inset-0 flex justify-center items-start z-50 bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full m-4">
            <h3 className="text-xl font-bold mb-4">Result Details - {viewingResult.examName}</h3>
            
            {/* Result Summary */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">Result Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-lg font-semibold">{viewingResult.score}/{viewingResult.total_marks}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-lg font-semibold">{viewingResult.percentage.toFixed(1)}%</p>
                </div>
                <div className={`p-4 rounded-lg ${
                  viewingResult.status === 'passed' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold capitalize">{viewingResult.status}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Time Taken</p>
                  <p className="text-lg font-semibold">{formatDuration(viewingResult.time_taken)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Attempted At</p>
                  <p className="text-lg font-semibold">{formatDate(viewingResult.attempted_at)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Completed At</p>
                  <p className="text-lg font-semibold">{formatDate(viewingResult.completed_at)}</p>
                </div>
              </div>
            </div>

            {/* Responses */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Student Responses</h2>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Loading responses...</span>
                </div>
              ) : error ? (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                  <p className="font-medium">Error loading responses:</p>
                  <p className="mt-1">{error}</p>
                </div>
              ) : responses.length === 0 ? (
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

                    return (
                      <div key={response.$id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
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
                              Marks: {questionMarks}
                            </span>
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

            <div className="flex justify-end mt-4">
              <button
                onClick={closeViewModal}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsAnalysisPage;