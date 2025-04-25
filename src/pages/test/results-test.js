// pages/results-test.js
import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID } from 'appwrite';

const ResultsTestPage = () => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    exam_id: '',
    score: 0,
    total_marks: 100,
    time_taken: 60,
    attempted_at: new Date().toISOString().substring(0, 16),
  });

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'results';

  const generateResultId = (examId, studentId) => {
    // Ensure the ID is max 36 characters
    const shortExamId = examId.substring(0, 10);
    const shortStudentId = studentId.substring(0, 10);
    const timestamp = Date.now().toString(36).substring(0, 6);
    const random = Math.random().toString(36).substring(2, 6);
    return `res_${shortExamId}_${shortStudentId}_${timestamp}_${random}`.substring(0, 36);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resultsResponse, studentsResponse, examsResponse] = await Promise.all([
        databases.listDocuments(databaseId, collectionId),
        databases.listDocuments(databaseId, 'students'),
        databases.listDocuments(databaseId, 'exams')
      ]);
      
      // Normalize ID references in results
      const fixedResults = resultsResponse.documents.map(result => {
        // Handle cases where IDs might be stored as objects
        const studentId = typeof result.student_id === 'object' ? 
          result.student_id.student_id || result.student_id.$id : 
          result.student_id;
        
        const examId = typeof result.exam_id === 'object' ? 
          result.exam_id.exam_id || result.exam_id.$id : 
          result.exam_id;
        
        return {
          ...result,
          student_id: studentId,
          exam_id: examId
        };
      });
      
      setResults(fixedResults);
      setStudents(studentsResponse.documents);
      setExams(examsResponse.documents);
      
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate selections
      if (!students.some(s => s.$id === formData.student_id)) {
        throw new Error('Selected student does not exist');
      }
      
      if (!exams.some(e => e.$id === formData.exam_id)) {
        throw new Error('Selected exam does not exist');
      }

      const percentage = (formData.score / formData.total_marks) * 100;
      const status = percentage >= 30 ? 'passed' : 'failed';
      const attemptedAt = new Date(formData.attempted_at);
      const completedAt = new Date(attemptedAt.getTime() + formData.time_taken * 60000);
      const resultId = generateResultId(formData.exam_id, formData.student_id);

      await databases.createDocument(
        databaseId,
        collectionId,
        ID.unique(),
        {
          result_id: resultId,
          student_id: formData.student_id,
          exam_id: formData.exam_id,
          score: parseInt(formData.score),
          total_marks: parseInt(formData.total_marks),
          percentage,
          status,
          time_taken: parseInt(formData.time_taken),
          attempted_at: attemptedAt.toISOString(),
          completed_at: completedAt.toISOString(),
          created_at: new Date().toISOString()
        }
      );

      await fetchAllData();
      setFormData({
        student_id: '',
        exam_id: '',
        score: 0,
        total_marks: 100,
        time_taken: 60,
        attempted_at: new Date().toISOString().substring(0, 16)
      });
    } catch (err) {
      setError(err.message);
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStudentName = (studentId) => {
    if (!students.length) return 'Loading...';
    
    // Match by either student_id or $id
    const student = students.find(s => 
      s.student_id === studentId || s.$id === studentId
    );
    
    if (!student) {
      console.warn(`Student not found for ID: ${studentId}`);
      console.log('Available students:', students);
      return 'Unknown Student';
    }
    return `${student.name} (${student.email})`;
  };

  const getExamName = (examId) => {
    if (!exams.length) return 'Loading...';
    
    // Match by either exam_id or $id
    const exam = exams.find(e => 
      e.exam_id === examId || e.$id === examId
    );
    
    if (!exam) {
      console.warn(`Exam not found for ID: ${examId}`);
      console.log('Available exams:', exams);
      return 'Unknown Exam';
    }
    return exam.name;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Results Management</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Result Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Result</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
                disabled={loading}
              >
                <option value="">Select Student</option>
                {students.map(student => (
                  <option key={student.$id} value={student.$id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
              <select
                name="exam_id"
                value={formData.exam_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
                disabled={loading}
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam.$id} value={exam.$id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  name="total_marks"
                  value={formData.total_marks}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Taken (minutes)</label>
              <input
                type="number"
                name="time_taken"
                value={formData.time_taken}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                min="1"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attempted At</label>
              <input
                type="datetime-local"
                name="attempted_at"
                value={formData.attempted_at}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Add Result'}
            </button>
          </form>
        </div>
        
        {/* Results List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Results</h2>
            <button 
              onClick={fetchAllData}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>
          
          {loading && results.length === 0 ? (
            <div className="text-center py-8">
              <p>Loading results...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p>No results found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(result => (
                <div key={result.$id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg">
                      {getStudentName(result.student_id)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      result.status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium text-gray-800">Exam:</span> {getExamName(result.exam_id)}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Score:</span> {result.score}/{result.total_marks} ({result.percentage.toFixed(1)}%)
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Time Taken:</span> {result.time_taken} minutes
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Attempted:</span> {formatDate(result.attempted_at)}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">Completed:</span> {formatDate(result.completed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTestPage;