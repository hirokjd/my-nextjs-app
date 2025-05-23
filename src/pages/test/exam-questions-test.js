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

  // Collection attributes
  const collectionAttributes = [
    { name: 'exam_id', type: 'relationship', description: 'Reference to the exam document' },
    { name: 'question_id', type: 'relationship', description: 'Reference to the question document' },
    { name: 'order', type: 'integer', description: 'Order of the question in the exam' },
    { name: 'marks', type: 'integer', description: 'Marks allocated for this question' },
    { name: '$id', type: 'string', description: 'Document ID' },
    { name: '$createdAt', type: 'datetime', description: 'Creation timestamp' },
    { name: '$updatedAt', type: 'datetime', description: 'Last update timestamp' },
    { name: '$permissions', type: 'array', description: 'Permission settings for the document' },
    { name: '$databaseId', type: 'string', description: 'Database ID' },
    { name: '$collectionId', type: 'string', description: 'Collection ID' }
  ];

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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelationship = (relationship) => {
    if (!relationship) return 'N/A';
    if (Array.isArray(relationship)) {
      return relationship.map(r => r.$id || r).join(', ');
    }
    if (typeof relationship === 'object') {
      return relationship.$id || 'Object';
    }
    return relationship;
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

      {/* Collection Attributes Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Exam Questions Collection Attributes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribute</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collectionAttributes.map((attr, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{attr.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{attr.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{attr.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-card p-6 rounded-lg shadow border border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            {editingId ? 'Edit Exam Question' : 'Add New Exam Question'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Exam</label>
              <select
                name="exam_id"
                value={formData.exam_id}
                onChange={handleChange}
                className="w-full p-2 border border-border rounded-md shadow-sm bg-background text-foreground"
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
              <label className="block text-sm font-medium text-foreground mb-1">Question</label>
              <select
                name="question_id"
                value={formData.question_id}
                onChange={handleChange}
                className="w-full p-2 border border-border rounded-md shadow-sm bg-background text-foreground"
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
                <label className="block text-sm font-medium text-foreground mb-1">Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md shadow-sm bg-background text-foreground"
                  min="1"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Marks</label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md shadow-sm bg-background text-foreground"
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
                className={`px-4 py-2 rounded-md text-primary-foreground ${loading ? 'bg-primary/70' : 'bg-primary hover:bg-primary/90'}`}
              >
                {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-card p-6 rounded-lg shadow border border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Exam Questions List</h2>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="text-sm bg-muted hover:bg-muted/80 px-3 py-1 rounded text-foreground"
            >
              Refresh
            </button>
          </div>

          {loading && examQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground">Loading exam questions...</p>
            </div>
          ) : examQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground">No exam questions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examQuestions.map((eq) => (
                <div key={eq.$id} className="border border-border rounded-lg p-4 hover:bg-muted/10 bg-background">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-foreground">{getExamName(eq.exam_id)}</h3>
                      <p className="text-sm text-muted">
                        {getQuestionText(eq.question_id)} {getQuestionDifficulty(eq.question_id)}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                        <div>
                          <span className="font-semibold text-foreground">Exam ID:</span> {formatRelationship(eq.exam_id)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Question ID:</span> {formatRelationship(eq.question_id)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">ID:</span> {eq.$id}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Created:</span> {formatDate(eq.$createdAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Updated:</span> {formatDate(eq.$updatedAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Permissions:</span> {eq.$permissions?.join(', ') || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                        Order: {eq.order}
                      </span>
                      <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs">
                        Marks: {eq.marks}
                      </span>
                      <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                        Database: {eq.$databaseId}
                      </span>
                      <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                        Collection: {eq.$collectionId}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleEdit(eq)}
                      className="text-sm text-primary hover:text-primary/80 px-2 py-1 rounded hover:bg-primary/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(eq.$id)}
                      className="text-sm text-danger hover:text-danger/80 px-2 py-1 rounded hover:bg-danger/10"
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