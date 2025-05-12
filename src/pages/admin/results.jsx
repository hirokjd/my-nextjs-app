import React, { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { Eye } from 'lucide-react';

const ResultsAnalysisPage = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resultsResponse, studentsResponse, examsResponse] = await Promise.all([
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID
        )
      ]);

      // Create lookup maps for students and exams
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

      // Normalize results with proper student and exam data
      const normalizedResults = resultsResponse.documents.map(result => {
        // Try to find student by both possible ID fields
        const student = studentMap.get(result.student_id) || 
                       studentMap.get(result.student_id?.$id);
        
        // Try to find exam by both possible ID fields
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

  const handleView = (result) => {
    setViewingResult(result);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingResult(null);
  };

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

      {loading ? (
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
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Result Details</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800">Student:</h4>
                <p>{viewingResult.studentName} ({viewingResult.studentEmail})</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Exam:</h4>
                <p>{viewingResult.examName}</p>
                <p className="text-sm text-gray-600">{viewingResult.examDescription}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Score:</h4>
                <p>{viewingResult.score}/{viewingResult.total_marks} ({viewingResult.percentage?.toFixed(1)}%)</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Status:</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  viewingResult.status === 'passed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {viewingResult.status.toUpperCase()}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Time Taken:</h4>
                <p>{viewingResult.time_taken} minutes</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Attempted At:</h4>
                <p>{new Date(viewingResult.attempted_at).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Completed At:</h4>
                <p>{new Date(viewingResult.completed_at).toLocaleString()}</p>
              </div>
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