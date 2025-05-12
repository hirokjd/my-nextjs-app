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
    selected_option: '0'
  });
  const [editingId, setEditingId] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'responses';
  

  const generateResponseId = (examId, studentId, questionId) => {
    const examPart = examId.substring(0, 8);
    const studentPart = studentId.substring(0, 8);
    const questionPart = questionId.substring(0, 8);
    const uniquePart = ID.unique().substring(0, 4);
    const combined = `${examPart}-${studentPart}-${questionPart}-${uniquePart}`;
    return combined.substring(0, 36);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [responsesRes, studentsRes, examsRes, questionsRes] = await Promise.all([
        databases.listDocuments(databaseId, collectionId, [Query.limit(100)]),
        databases.listDocuments(databaseId, 'students', [Query.limit(100)]),
        databases.listDocuments(databaseId, 'exams', [Query.limit(100)]),
        databases.listDocuments(databaseId, 'questions', [Query.limit(100)])
      ]);

      const fixedResponses = responsesRes.documents.map(response => ({
        ...response,
        student_id: typeof response.student_id === 'object' ? 
          response.student_id.student_id || response.student_id.$id : response.student_id,
        exam_id: typeof response.exam_id === 'object' ? 
          response.exam_id.exam_id || response.exam_id.$id : response.exam_id,
        question_id: typeof response.question_id === 'object' ? 
          response.question_id.question_id || response.question_id.$id : response.question_id
      }));

      setResponses(fixedResponses);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const responseData = {
        student_id: formData.student_id,
        exam_id: formData.exam_id,
        question_id: formData.question_id,
        selected_option: parseInt(formData.selected_option),
        response_id: generateResponseId(
          formData.exam_id,
          formData.student_id,
          formData.question_id
        )
      };

      if (editingId) {
        await databases.updateDocument(databaseId, collectionId, editingId, responseData);
      } else {
        await databases.createDocument(
          databaseId, 
          collectionId,
          responseData.response_id,
          responseData
        );
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
    // Ensure we're using the correct ID format (either direct ID or from object)
    const studentId = typeof response.student_id === 'object' ? 
      response.student_id.student_id || response.student_id.$id : response.student_id;
    const examId = typeof response.exam_id === 'object' ? 
      response.exam_id.exam_id || response.exam_id.$id : response.exam_id;
    const questionId = typeof response.question_id === 'object' ? 
      response.question_id.question_id || response.question_id.$id : response.question_id;

    setFormData({
      student_id: studentId,
      exam_id: examId,
      question_id: questionId,
      selected_option: response.selected_option.toString()
    });
    setEditingId(response.$id);
  };

  const handleDelete = async (responseId) => {
    if (window.confirm('Are you sure you want to delete this response?')) {
      try {
        await databases.deleteDocument(databaseId, collectionId, responseId);
        await fetchAllData();
        if (editingId === responseId) resetForm();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      exam_id: '',
      question_id: '',
      selected_option: '0'
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.student_id === studentId || s.$id === studentId);
    return student?.name || 'Unknown Student';
  };

  const getStudentEmail = (studentId) => {
    const student = students.find(s => s.student_id === studentId || s.$id === studentId);
    return student?.email || 'No email';
  };

  const getExamName = (examId) => {
    const exam = exams.find(e => e.exam_id === examId || e.$id === examId);
    return exam?.name || 'Unknown Exam';
  };

  const getQuestionText = (questionId) => {
    const question = questions.find(q => q.question_id === questionId || q.$id === questionId);
    return question?.text || `Question ${question?.question_id || 'Unknown'}`;
  };

  const isCorrectAnswer = (response) => {
    const question = questions.find(q => 
      q.question_id === response.question_id || q.$id === response.question_id
    );
    return question && response.selected_option === question.correct_answer;
  };

  useEffect(() => { fetchAllData(); }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Responses Management</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Response' : 'Add New Response'}
          </h2>
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
                {questions.map(question => (
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
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Response' : 'Add Response')}
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
        
        {/* Responses List Section */}
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
              {responses.map(response => (
                <div key={response.$id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {getStudentName(response.student_id)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getStudentEmail(response.student_id)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isCorrectAnswer(response) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Option {parseInt(response.selected_option) + 1}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">Exam:</span> {getExamName(response.exam_id)}</p>
                    <p><span className="font-medium text-gray-800">Question:</span> {getQuestionText(response.question_id)}</p>
                    <p className={`text-sm ${isCorrectAnswer(response) ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrectAnswer(response) ? '✓ Correct Answer' : '✗ Incorrect Answer'}
                    </p>
                    <p className="text-xs text-gray-500">ID: {response.response_id || response.$id}</p>
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