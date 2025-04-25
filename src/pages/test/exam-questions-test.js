// pages/exam-questions-test.js
import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID, Query } from 'appwrite';

const ExamQuestionsTestPage = () => {
  const [examQuestions, setExamQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    exam_id: '',
    question_id: '',
    order: 1,
    marks: 1
  });

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'examQuestions';

  const fetchExamQuestions = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setExamQuestions(response.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          order: parseInt(formData.order),
          marks: parseInt(formData.marks)
        }
      );
      await fetchExamQuestions();
      setFormData({
        exam_id: '',
        question_id: '',
        order: 1,
        marks: 1
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

  const getExamName = (examId) => {
    const exam = exams.find(e => e.$id === examId);
    return exam ? exam.name : 'Unknown Exam';
  };

  const getQuestionText = (questionId) => {
    const question = questions.find(q => q.$id === questionId);
    return question ? question.text : 'Unknown Question';
  };

  useEffect(() => {
    fetchExamQuestions();
    fetchExams();
    fetchQuestions();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exam Questions Collection Test</h1>
      
      {error && <div className="bg-red-100 p-4 mb-4 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add Exam Question</h2>
          <form onSubmit={handleSubmit}>
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
              <label className="block mb-2">Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Marks</label>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="1"
                max="10"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Exam Question'}
            </button>
          </form>
        </div>
        
        {/* Data Display */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Exam Questions List</h2>
          {loading ? (
            <p>Loading exam questions...</p>
          ) : examQuestions.length === 0 ? (
            <p>No exam questions found</p>
          ) : (
            <div className="space-y-4">
              {examQuestions.map(eq => (
                <div key={eq.$id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{getExamName(eq.exam_id)}</h3>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      Order: {eq.order}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-medium">Question:</span> {getQuestionText(eq.question_id)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Marks:</span> {eq.marks}
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

export default ExamQuestionsTestPage;