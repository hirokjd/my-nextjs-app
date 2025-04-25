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

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setResults(response.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await databases.listDocuments(databaseId, 'students');
      setStudents(response.documents);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchExams = async () => {
    try {
      const response = await databases.listDocuments(databaseId, 'exams');
      setExams(response.documents);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newResultId = ID.unique();
      const percentage = (formData.score / formData.total_marks) * 100;
      const status = percentage >= 50 ? 'passed' : 'failed';

      const attemptedAt = new Date(formData.attempted_at);
      const completedAt = new Date(attemptedAt.getTime() + formData.time_taken * 60000);

      await databases.createDocument(
        databaseId,
        collectionId,
        newResultId,
        {
          result_id: newResultId,
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

      await fetchResults();

      // Reset form
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
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.$id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const getExamName = (examId) => {
    const exam = exams.find(e => e.$id === examId);
    return exam ? exam.name : 'Unknown Exam';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchResults();
    fetchStudents();
    fetchExams();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Results Collection Test</h1>
      
      {error && <div className="bg-red-100 p-4 mb-4 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Result</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2">Student</label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Student</option>
                {students.map(student => (
                  <option key={student.$id} value={student.$id}>{student.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Exam</label>
              <select
                name="exam_id"
                value={formData.exam_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam.$id} value={exam.$id}>{exam.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Score</label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Total Marks</label>
              <input
                type="number"
                name="total_marks"
                value={formData.total_marks}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Time Taken (minutes)</label>
              <input
                type="number"
                name="time_taken"
                value={formData.time_taken}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Attempted At</label>
              <input
                type="datetime-local"
                name="attempted_at"
                value={formData.attempted_at}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Result'}
            </button>
          </form>
        </div>
        
        {/* Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Results List</h2>
          {loading ? (
            <p>Loading results...</p>
          ) : results.length === 0 ? (
            <p>No results found</p>
          ) : (
            <div className="space-y-4">
              {results.map(result => (
                <div key={result.$id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{getStudentName(result.student_id)}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <p><span className="font-medium">Exam:</span> {getExamName(result.exam_id)}</p>
                    <p><span className="font-medium">Score:</span> {result.score}/{result.total_marks} ({result.percentage.toFixed(1)}%)</p>
                    <p><span className="font-medium">Time Taken:</span> {result.time_taken} minutes</p>
                    <p><span className="font-medium">Attempted At:</span> {formatDate(result.attempted_at)}</p>
                    <p><span className="font-medium">Completed At:</span> {formatDate(result.completed_at)}</p>
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
