// pages/questions-test.js
import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID } from 'appwrite';

const QuestionsTestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    question_id: '',
    text: '',
    options_text: ['', '', '', ''],
    correct_answer: 0,
    difficulty: 'easy',
    tags: [],
    created_by: 'test-user'
  });
  const [newTag, setNewTag] = useState('');

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'questions';

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setQuestions(response.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          options_text: formData.options_text.filter(opt => opt.trim() !== '')
        }
      );
      await fetchQuestions();
      setFormData({
        question_id: '',
        text: '',
        options_text: ['', '', '', ''],
        correct_answer: 0,
        difficulty: 'easy',
        tags: [],
        created_by: 'test-user'
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

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options_text];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options_text: newOptions }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Questions Collection Test</h1>
      
      {error && <div className="bg-red-100 p-4 mb-4 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2">Question ID</label>
              <input
                type="text"
                name="question_id"
                value={formData.question_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Question Text</label>
              <textarea
                name="text"
                value={formData.text}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows="3"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Options</label>
              {formData.options_text.map((option, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Correct Answer</label>
              <select
                name="correct_answer"
                value={formData.correct_answer}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                {formData.options_text.map((option, index) => (
                  <option key={index} value={index} disabled={option.trim() === ''}>
                    Option {index + 1} {option.trim() === '' ? '(empty)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Tags</label>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 p-2 border rounded-l"
                  placeholder="Add tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-200 px-4 rounded-r"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Question'}
            </button>
          </form>
        </div>
        
        {/* Data Display */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Questions List</h2>
          {loading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p>No questions found</p>
          ) : (
            <div className="space-y-4">
              {questions.map(question => (
                <div key={question.$id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{question.text}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">ID: {question.question_id}</p>
                    {question.tags && question.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {question.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {question.options_text?.map((option, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded text-sm ${
                          question.correct_answer === index ? 
                          'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
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

export default QuestionsTestPage;