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
    response_id: '',
    student_id: '',
    exam_id: '',
    question_id: '',
    selected_option: 0
  });
  const [editingId, setEditingId] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'responses';

  // Collection attributes
  const collectionAttributes = [
    { name: 'response_id', type: 'string', description: 'Unique identifier for the response', size: 36, required: true },
    { name: 'student_id', type: 'relationship', description: 'Reference to the student document', relationType: 'manyToOne', relatedCollection: 'students' },
    { name: 'exam_id', type: 'relationship', description: 'Reference to the exam document', relationType: 'manyToOne', relatedCollection: 'exams' },
    { name: 'question_id', type: 'relationship', description: 'Reference to the question document', relationType: 'manyToOne', relatedCollection: 'questions' },
    { name: 'selected_option', type: 'integer', description: 'Option selected by student (0-3)', min: 0, max: 3, required: true },
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
      const [responsesRes, studentsRes, examsRes, questionsRes] = await Promise.all([
        databases.listDocuments(databaseId, collectionId, [Query.limit(100), Query.orderDesc('$createdAt')]),
        databases.listDocuments(databaseId, 'students', [Query.limit(100)]),
        databases.listDocuments(databaseId, 'exams', [Query.limit(100)]),
        databases.listDocuments(databaseId, 'questions', [Query.limit(100)])
      ]);

      setResponses(responsesRes.documents);
      setStudents(studentsRes.documents);
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

  const getStudentName = (studentId) => {
    const resolvedId = resolveRelationshipId(studentId);
    const student = students.find(s => s.$id === resolvedId || s.student_id === resolvedId);
    return student ? `${student.name} (${student.student_id})` : 'Unknown Student';
  };

  const getExamName = (examId) => {
    const resolvedId = resolveRelationshipId(examId);
    const exam = exams.find(e => e.$id === resolvedId || e.exam_id === resolvedId);
    return exam ? `${exam.name} (${exam.exam_id})` : 'Unknown Exam';
  };

  const getQuestionText = (questionId) => {
    const resolvedId = resolveRelationshipId(questionId);
    const question = questions.find(q => q.$id === resolvedId || q.question_id === resolvedId);
    return question?.text?.substring(0, 50) || `Question ${question?.question_id || 'Unknown'}`;
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
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        response_id: formData.response_id || ID.unique(),
        student_id: formData.student_id,
        exam_id: formData.exam_id,
        question_id: formData.question_id,
        selected_option: parseInt(formData.selected_option)
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

  const handleEdit = (response) => {
    setFormData({
      response_id: response.response_id,
      student_id: resolveRelationshipId(response.student_id) || '',
      exam_id: resolveRelationshipId(response.exam_id) || '',
      question_id: resolveRelationshipId(response.question_id) || '',
      selected_option: response.selected_option
    });
    setEditingId(response.$id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this response?')) {
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
      response_id: '',
      student_id: '',
      exam_id: '',
      question_id: '',
      selected_option: 0
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exam Responses Management</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Collection Attributes Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Responses Collection Attributes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribute</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {collectionAttributes.map((attr, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{attr.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{attr.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attr.size && `Size: ${attr.size}`}
                    {attr.relationType && `Relation: ${attr.relationType}`}
                    {attr.relatedCollection && `Related: ${attr.relatedCollection}`}
                    {attr.min !== undefined && `Min: ${attr.min}`}
                    {attr.max !== undefined && `Max: ${attr.max}`}
                    {attr.required && 'Required'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{attr.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Response' : 'Add New Response'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response ID</label>
                <input
                  type="text"
                  name="response_id"
                  value={formData.response_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  placeholder="Leave empty to auto-generate"
                  disabled={loading}
                  maxLength={36}
                />
              </div>
            )}

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
                {students.map((student) => (
                  <option key={student.$id} value={student.$id}>
                    {student.name} ({student.student_id})
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selected Option</label>
              <select
                name="selected_option"
                value={formData.selected_option}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
                disabled={loading}
              >
                <option value="0">Option 0</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
                <option value="3">Option 3</option>
              </select>
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
            <h2 className="text-xl font-semibold">Responses List</h2>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>

          {loading && responses.length === 0 ? (
            <div className="text-center py-8">
              <p>Loading responses...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-8">
              <p>No responses found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response.$id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">Response {response.response_id}</h3>
                      <p className="text-sm text-gray-600">
                        {getStudentName(response.student_id)} - {getExamName(response.exam_id)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getQuestionText(response.question_id)}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-semibold">Selected Option:</span> {response.selected_option}
                        </div>
                        <div>
                          <span className="font-semibold">Student ID:</span> {formatRelationship(response.student_id)}
                        </div>
                        <div>
                          <span className="font-semibold">Exam ID:</span> {formatRelationship(response.exam_id)}
                        </div>
                        <div>
                          <span className="font-semibold">Question ID:</span> {formatRelationship(response.question_id)}
                        </div>
                        <div>
                          <span className="font-semibold">Created:</span> {formatDate(response.$createdAt)}
                        </div>
                        <div>
                          <span className="font-semibold">Updated:</span> {formatDate(response.$updatedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Option: {response.selected_option}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        Response ID: {response.response_id}
                      </span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Database: {response.$databaseId}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Collection: {response.$collectionId}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleEdit(response)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(response.$id)}
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

export default ResponsesTestPage;