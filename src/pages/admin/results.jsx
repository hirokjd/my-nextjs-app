import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { databases, storage, Query } from '../../utils/appwrite';
import { Eye, Search, Download, RefreshCw, X, Send } from 'lucide-react';
import { formatDateTimeUTC } from "../../utils/date";

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
    return null;
  };
  
  const getQuestionMarks = (questionId) => {
    const mapping = examQuestions.find(eq => resolveRelationshipId(eq.question_id) === questionId);
    return mapping?.marks || 0;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return formatDateTimeUTC(new Date(dateString));
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resultsResponse, studentsResponse, examsResponse] = await Promise.all([
        databases.listDocuments(databaseId, resultsCollectionId, [Query.orderDesc("$createdAt")]),
        databases.listDocuments(databaseId, studentsCollectionId),
        databases.listDocuments(databaseId, examsCollectionId)
      ]);

      const studentMap = new Map(studentsResponse.documents.map(s => [s.$id, s]));
      const examMap = new Map(examsResponse.documents.map(e => [e.$id, e]));

      const normalizedResults = resultsResponse.documents.map(result => {
        const studentId = resolveRelationshipId(result.student_id);
        const examId = resolveRelationshipId(result.exam_id);
        const student = studentMap.get(studentId);
        const exam = examMap.get(examId);

        return {
          ...result,
          studentName: student ? student.name : 'Unknown Student',
          studentEmail: student ? student.email : 'N/A',
          studentId: studentId,
          examName: exam ? exam.name : 'Unknown Exam',
          examId: examId,
          percentage: result.total_marks > 0 ? (result.score / result.total_marks * 100) : 0,
          status: (result.score / result.total_marks * 100) >= 30 ? 'passed' : 'failed',
          createdDate: result.$createdAt ? formatDateTimeUTC(result.$createdAt) : 'N/A'
        };
      });

      setResults(normalizedResults);
      setStudents(studentsResponse.documents);
      setExams(examsResponse.documents);
    } catch (err) {
      setError(err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [databaseId, resultsCollectionId, studentsCollectionId, examsCollectionId]);

  const fetchResponseData = useCallback(async (result) => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Fetch all documents and filter client-side due to virtual relationship query limitation
      const allExamQuestionsResponse = await databases.listDocuments(
        databaseId,
        examQuestionsCollectionId,
        [Query.limit(5000), Query.orderAsc('order')]
      );
      const filteredExamQuestions = allExamQuestionsResponse.documents.filter(doc =>
        resolveRelationshipId(doc.exam_id) === result.examId
      );
      setExamQuestions(filteredExamQuestions);
      
      const allResponsesResponse = await databases.listDocuments(
        databaseId,
        responsesCollectionId,
        [Query.limit(5000)]
      );
      const filteredResponses = allResponsesResponse.documents.filter(res =>
        resolveRelationshipId(res.student_id) === result.studentId &&
        resolveRelationshipId(res.exam_id) === result.examId
      );
      setResponses(filteredResponses);

      const questionIds = filteredExamQuestions.map(eq => resolveRelationshipId(eq.question_id)).filter(Boolean);
      
      if (questionIds.length > 0) {
        const questionsResponse = await databases.listDocuments(
          databaseId,
          questionsCollectionId,
          [Query.equal('$id', questionIds), Query.limit(100)]
        );
        setQuestions(questionsResponse.documents);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load response details.');
    } finally {
      setLoading(false);
    }
  }, [databaseId, examQuestionsCollectionId, responsesCollectionId, questionsCollectionId]);


  const handleExport = async (format) => { /* ... No changes needed here ... */ };

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

  const filteredResults = useMemo(() => {
    return (results || []).filter(result => {
        const matchesSearch =
            (result.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (result.examName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Pass' && result.status === 'passed') ||
            (statusFilter === 'Fail' && result.status === 'failed');
        const matchesExam =
            examFilter === 'All' ||
            result.examId === examFilter;
        return matchesSearch && matchesStatus && matchesExam;
    });
  }, [results, searchTerm, statusFilter, examFilter]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Exam Results</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchAllData} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm" disabled={loading}>
              <RefreshCw size={18} /> Refresh
            </button>
            <button onClick={() => window.location.href = '/admin/publish-results'} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm">
              <Send size={18} /> Publish Results
            </button>
            <div className="relative" ref={exportButtonRef}>
              <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm">
                <Download size={18} />
                <span>Export</span>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <button onClick={() => handleExport("csv")} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export to CSV</button>
                  <button onClick={() => handleExport("xls")} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Export to XLS</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && !viewModalOpen && ( <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert"><strong className="font-bold">Error:</strong><span className="block sm:inline ml-2">{error}</span></div> )}

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-grow sm:ml-0 w-full sm:w-auto">
            <label htmlFor="main_search" className="sr-only">Search Results</label>
            <input type="text" id="main_search" placeholder="Search by student or exam..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50 pl-10" />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" />
          </div>
          <label htmlFor="exam_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Exam:</label>
          <select id="exam_filter" value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50">
            <option value="All">All Exams</option>
            {exams.map(exam => (<option key={exam.$id} value={exam.$id}>{exam.name}</option>))}
          </select>
          {examFilter !== 'All' && (<button onClick={() => setExamFilter('All')} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"><X size={16} />Clear Exam</button>)}
          <label htmlFor="status_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Status:</label>
          <select id="status_filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50">
            <option value="All">All Statuses</option>
            <option value="Pass">Passed</option>
            <option value="Fail">Failed</option>
          </select>
          {statusFilter !== 'All' && (<button onClick={() => setStatusFilter('All')} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"><X size={16} />Clear Status</button>)}
        </div>

        {loading && !viewModalOpen ? (
          <div className="flex justify-center items-center h-64"><p className="text-xl text-gray-600">Loading...</p></div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-10"><p className="text-gray-500 text-lg">No results found.</p></div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.studentName}<div className="text-sm text-gray-500 sm:hidden">{result.examName}</div></td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{result.examName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.score}/{result.total_marks} ({result.percentage?.toFixed(1)}%)</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>{result.status.toUpperCase()}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell whitespace-nowrap">{result.createdDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ result.publish ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }`}>{result.publish ? 'Published' : 'Not Published'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><ActionButtons result={result} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewModalOpen && viewingResult && (
          <div className="fixed inset-0 flex justify-center items-start z-50 bg-black bg-opacity-50 overflow-y-auto p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full my-8">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold">Result Details: {viewingResult.examName}</h3>
                    <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="text-lg font-semibold mb-2">Result Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-2 bg-blue-100 rounded-lg"><p className="text-sm text-blue-800">Student</p><p className="font-semibold">{viewingResult.studentName}</p></div>
                        <div className="p-2 bg-blue-100 rounded-lg"><p className="text-sm text-blue-800">Score</p><p className="font-semibold">{viewingResult.score}/{viewingResult.total_marks}</p></div>
                        <div className="p-2 bg-blue-100 rounded-lg"><p className="text-sm text-blue-800">Percentage</p><p className="font-semibold">{viewingResult.percentage.toFixed(1)}%</p></div>
                        <div className={`p-2 rounded-lg ${viewingResult.status === 'passed' ? 'bg-green-100' : 'bg-red-100'}`}><p className={`text-sm ${viewingResult.status === 'passed' ? 'text-green-800' : 'text-red-800'}`}>Status</p><p className="font-semibold capitalize">{viewingResult.status}</p></div>
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-2">Student Responses</h4>
                    {loading ? ( <p>Loading responses...</p> ) : error ? (<p className='text-red-500'>{error}</p>) : (
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                        {examQuestions.length > 0 ? examQuestions.map((examQuestion, index) => {
                            const questionId = resolveRelationshipId(examQuestion.question_id);
                            const question = questions.find(q => q.$id === questionId);
                            const response = responses.find(r => resolveRelationshipId(r.question_id) === questionId);
                            
                            if (!question) return <div key={index} className="p-4 border rounded-lg">Loading question data...</div>;

                            const selectedOption = response ? response.selected_option : null;
                            const correctOption = question.correct_answer;

                            return (
                                <div key={question.$id} className="border p-4 rounded-lg bg-white">
                                <p className="font-bold">{index + 1}. {question.text}</p>
                                <div className="mt-2 space-y-2">
                                    {question.options_text?.map((optionText, optIndex) => {
                                        const isSelected = selectedOption === optIndex;
                                        const isCorrect = correctOption === optIndex;
                                        let optionClasses = "p-2 border rounded-md text-sm";
                                        if (isCorrect) {
                                            optionClasses += " bg-green-100 border-green-300 font-semibold";
                                        } else if (isSelected && !isCorrect) {
                                            optionClasses += " bg-red-100 border-red-300";
                                        } else {
                                            optionClasses += " bg-gray-50 border-gray-200";
                                        }
                                        return (
                                            <div key={optIndex} className={optionClasses}>
                                            {optionText}
                                            {isSelected && <span className="text-xs font-bold ml-2"> (Your Answer)</span>}
                                            {isCorrect && !isSelected && <span className="text-xs font-bold text-green-700 ml-2"> (Correct Answer)</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {selectedOption === null && <p className="text-sm text-gray-500 mt-2">Not Answered</p>}
                                </div>
                            );
                        }) : <p className="text-center text-gray-500 py-4">No questions were found for this exam.</p>}
                    </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={closeViewModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Close</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsAnalysisPage;