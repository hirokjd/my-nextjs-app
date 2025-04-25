// pages/responses-test.js
import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID, Query } from 'appwrite';

const ResponsesTestPage = () => {
  const [responses, setResponses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    exam_id: '',
    question_id: '',
    selected_option: 0
  });

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'responses';

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setResponses(response.documents);
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

  const fetchQuestions = async () => {
    try {
      const response = await databases.listDocuments(databaseId, 'questions');
      setQuestions(response.documents);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await databases.createDocument(
        databaseId, 
        collectionId,
        ID.unique(),
        {
          ...formData,
          selected_option: parseInt(formData.selected_option)
        }
      );
      await fetchResponses();
      setFormData({
        student_id: '',
        exam_id: '',
        question_id: '',
        selected_option: 0
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

  const getQuestionText = (questionId) => {
    const question = questions.find(q => q.$id === questionId);
    return question ? question.text : 'Unknown Question';
  };

  useEffect(() => {
    fetchResponses();
    fetchStudents();
    fetchExams();
    fetchQuestions();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Responses Collection Test</h1>
      
      {error && <div className="bg-red-100 p-4 mb-4 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Response</h2>
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
              <label className="block mb-2">Question</label>
              <select
                name="question_id"
                value={formData.question_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Question</option>
                {questions.map(question => (
                  <option key={question.$id} value={question.$id}>
                    {question.text ? question.text.substring(0, 50) + '...' : 'Question ' + question.$id}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Selected Option</label>
              <select
                name="selected_option"
                value={formData.selected_option}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Response'}
            </button>
          </form>
        </div>
        
        {/* Data Display */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Responses List</h2>
          {loading ? (
            <p>Loading responses...</p>
          ) : responses.length === 0 ? (
            <p>No responses found</p>
          ) : (
            <div className="space-y-4">
              {responses.map(response => (
                <div key={response.$id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{getStudentName(response.student_id)}</h3>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      Option {parseInt(response.selected_option) + 1}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Exam:</span> {getExamName(response.exam_id)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Question:</span> {getQuestionText(response.question_id)}
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

export default ResponsesTestPage;