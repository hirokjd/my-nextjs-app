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
  const [editingId, setEditingId] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'exam_questions';

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [examQuestionsRes, examsRes, questionsRes] = await Promise.all([
        databases.listDocuments(databaseId, collectionId, [Query.limit(100), Query.orderAsc('order')]),
        databases.listDocuments(databaseId, 'exams', [Query.limit(100)]),
        databases.listDocuments(databaseId, 'questions', [Query.limit(100)])
      ]);

      setExamQuestions(examQuestionsRes.documents);
      setExams(examsRes.documents);
      setQuestions(questionsRes.documents);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    return field;
  };

  const getExamName = (examId) => {
    const resolvedId = resolveRelationshipId(examId);
    const exam = exams.find(e => e.$id === resolvedId || e.exam_id === resolvedId);
    if (exam) {
      return `${exam.name} (${exam.exam_id})`;
    }
    return 'Unknown Exam';
  };

  const getQuestionText = (questionId) => {
    const resolvedId = resolveRelationshipId(questionId);
    const question = questions.find(q => q.$id === resolvedId || q.question_id === resolvedId);
    return question?.text?.substring(0, 50) || `Question ${question?.question_id || 'Unknown'}`;
  };

  const getQuestionDifficulty = (questionId) => {
    const resolvedId = resolveRelationshipId(questionId);
    const question = questions.find(q => q.$id === resolvedId || q.question_id === resolvedId);
    return question?.difficulty ? `(${question.difficulty})` : '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        exam_id: [formData.exam_id],
        question_id: [formData.question_id],
        order: parseInt(formData.order),
        marks: parseInt(formData.marks)
      };

      if (editingId) {
        await databases.updateDocument(databaseId, collectionId, editingId, data);
      } else {
        await databases.createDocument(databaseId, collectionId, ID.unique(), data);
      }

      await fetchAllData();
      resetForm();
    } catch (err) {
      setError(err.message);
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (examQuestion) => {
    setFormData({
      exam_id: resolveRelationshipId(examQuestion.exam_id) || '',
      question_id: resolveRelationshipId(examQuestion.question_id) || '',
      order: examQuestion.order,
      marks: examQuestion.marks
    });
    setEditingId(examQuestion.$id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam question?')) {
      try {
        await databases.deleteDocument(databaseId, collectionId, id);
        await fetchAllData();
        if (editingId === id) resetForm();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      exam_id: '',
      question_id: '',
      order: 1,
      marks: 1
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exam Questions Management</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Exam Question' : 'Add New Exam Question'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                {exams.map((exam) => (
                  <option key={exam.$id} value={exam.$id}>
                    {exam.name} ({exam.exam_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <select
                name="question_id"
                value={formData.question_id}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
                disabled={loading}
              >
                <option value="">Select Question</option>
                {questions.map((question) => (
                  <option key={question.$id} value={question.$id}>
                    {question.text?.substring(0, 50) || `Question ${question.question_id}`}
                    {question.text?.length > 50 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  min="-10"
                  max="10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Exam Questions List</h2>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>

          {loading && examQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p>Loading exam questions...</p>
            </div>
          ) : examQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p>No exam questions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examQuestions.map((eq) => (
                <div key={eq.$id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{getExamName(eq.exam_id)}</h3>
                      <p className="text-sm text-gray-600">
                        {getQuestionText(eq.question_id)} {getQuestionDifficulty(eq.question_id)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Order: {eq.order}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Marks: {eq.marks}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(eq.$id)}
                      className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
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
