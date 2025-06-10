import React, { useState, useEffect, useRef } from 'react';
import { databases, storage, Query } from '../../utils/appwrite';
import { Eye, Search, Download, RefreshCw, X, Send } from 'lucide-react';

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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const exportButtonRef = useRef(null);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const examQuestionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;
  const questionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
  const responsesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;

  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field?.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    if (typeof field === 'string') return field;
    console.warn('Unexpected relationship field format:', field);
    return null;
  };

  const getFileUrl = async (fileId) => {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (error) {
      console.error('Error fetching image:', error.message);
      return null;
    }
  };

  const getQuestionMarks = (questionId) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = resolveRelationshipId(qRef);
      return refId === questionId;
    });
    return mapping?.marks || 0;
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

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
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
      setError(err.message || 'Failed to fetch data.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponseData = async (result) => {
    try {
      setLoading(true);
      setError(null);

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

      const responsesResponse = await databases.listDocuments(
        databaseId,
        responsesCollectionId,
        [
          Query.equal('student_id', result.studentId),
          Query.equal('exam_id', result.examId),
        ]
      );

      setResponses(responsesResponse.documents);

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

  const handleExport = async (format) => {
    setIsExportMenuOpen(false);
    if (filteredResults.length === 0) {
      setError("No results available to export.");
      return;
    }
    try {
      const exportData = filteredResults.map(result => ({
        "Student Name": result.studentName,
        "Student Email": result.studentEmail || "N/A",
        "Exam Name": result.examName,
        "Score": `${result.score}/${result.total_marks}`,
        "Percentage": `${result.percentage.toFixed(1)}%`,
        "Status": result.status,
        "Date": result.createdDate,
        "Published": result.publish ? "Published" : "Not Published"
      }));

      if (format === "csv") {
        const { Parser } = await import("json2csv");
        const fields = ["Student Name", "Student Email", "Exam Name", "Score", "Percentage", "Status", "Date", "Published"];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `results_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "xls") {
        const { utils, writeFile } = await import("xlsx");
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Results");
        writeFile(wb, `results_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      setError(`Failed to export to ${format.toUpperCase()}: ${error.message}`);
    }
  };

  const handleView = (result) => {
    setViewingResult(result);
    setViewModalOpen(true);
    fetchResponseData(result);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingResult(null);
    setResponses([]);
    setQuestions([]);
    setExamQuestions([]);
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const ActionButtons = ({ result }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 transition-colors duration-200"
        onClick={() => handleView(result)}
        title="View"
        aria-label="View result"
      >
        <Eye size={16} className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
      <div className="container mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Exam Enrollments</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchAllData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
              disabled={loading}
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <button
              onClick={() => window.location.href = '/admin/publish-results'}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
            >
              <Send size={18} /> Publish Results
            </button>
            <div className="relative" ref={exportButtonRef}>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                <Download size={18} />
                <span>Export</span>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleExport("csv")}
                  >
                    Export to CSV
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleExport("xls")}
                  >
                    Export to XLS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && !viewModalOpen && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-grow sm:ml-0Evans w-full sm:w-auto">
            <label htmlFor="main_search" className="sr-only">Search Results</label>
            <input
              type="text"
              id="main_search"
              placeholder="Search by student or exam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50 pl-10"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" />
          </div>
          <label htmlFor="exam_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Exam:</label>
          <select
            id="exam_filter"
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
          >
            <option value="All">All Exams</option>
            {exams.map(exam => (
              <option key={exam.$id} value={exam.$id}>
                {exam.name}
              </option>
            ))}
          </select>
          {examFilter !== 'All' && (
            <button
              onClick={() => setExamFilter('All')}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"
            >
              <X size={16} />
              Clear Exam
            </button>
          )}
          <label htmlFor="status_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Status:</label>
          <select
            id="status_filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
          >
            <option value="All">All Statuses</option>
            <option value="Pass">Passed</option>
            <option value="Fail">Failed</option>
          </select>
          {statusFilter !== 'All' && (
            <button
              onClick={() => setStatusFilter('All')}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"
            >
              <X size={16} />
              Clear Status
            </button>
          )}
        </div>

        {loading && !viewModalOpen ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">{searchTerm || examFilter !== 'All' || statusFilter !== 'All' ? "No results match your search or filter." : "No results found."}</p>
            {!searchTerm && examFilter === 'All' && statusFilter === 'All' && <p className="text-gray-400">Data may be loading or unavailable.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Exam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Published</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result.$id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.studentName}
                      <div className="text-sm text-gray-500 sm:hidden">{result.examName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      {result.examName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.score}/{result.total_marks} ({result.percentage?.toFixed(1)}%)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">
                      {result.createdDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        result.publish ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.publish ? 'Published' : 'Not Published'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <ActionButtons result={result} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewModalOpen && viewingResult && (
          <div className="fixed inset-0 flex justify-center items-start z-50 bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full m-4">
              <h3 className="text-xl font-bold mb-4">Result Details - { viewingResult.examName}</h3>
              
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
                  <div className={`p-4 rounded-lg ${viewingResult.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}>
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
                            {question.optionsText?.map((option, optIndex) => {
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
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsAnalysisPage;