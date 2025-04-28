// pages/test/questions-test.js
import { useState, useEffect, useCallback } from 'react';
import { databases, storage } from '../../utils/appwrite';
import { ID } from 'appwrite';
import { Query } from 'appwrite';

const QuestionsTestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    question_id: '',
    text: '',
    image_id: '',
    options_text: ['', '', '', ''],
    options_image: ['', '', '', ''],
    correct_answer: 0,
    difficulty: 'easy',
    tags: [],
    created_by: 'test-user'
  });
  const [newTag, setNewTag] = useState('');
  const [optionImageFiles, setOptionImageFiles] = useState([null, null, null, null]);
  const [questionImageFile, setQuestionImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [questionImagePreview, setQuestionImagePreview] = useState(null);
  const [optionImagePreviews, setOptionImagePreviews] = useState([null, null, null, null]);

  const BUCKET_ID = 'questions';
  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'questions';

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      // const response = await databases.listDocuments(databaseId, collectionId);
      const response = await databases.listDocuments(databaseId, collectionId, [
        Query.limit(100) // Increase this number as needed
      ]);
      
      const questionsWithImages = await Promise.all(
        response.documents.map(async (question) => {
          const imageUrl = question.image_id ? await getFileUrl(question.image_id) : null;
          const optionsImageUrls = await Promise.all(
            question.options_image.map(async (imgId) => 
              imgId ? await getFileUrl(imgId) : null
            )
          );
          
          return {
            ...question,
            imageUrl,
            optionsImageUrls
          };
        })
      );
      
      setQuestions(questionsWithImages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFileUrl = async (fileId) => {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (err) {
      console.error("Error fetching image:", err.message);
      return null;
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Handle image uploads
      let questionImageId = formData.image_id;
      if (questionImageFile) {
        // Delete old image if editing
        if (editingId && formData.image_id) {
          try {
            await storage.deleteFile(BUCKET_ID, formData.image_id);
          } catch (err) {
            console.error("Error deleting old image:", err.message);
          }
        }
        const uploadResponse = await storage.createFile(BUCKET_ID, ID.unique(), questionImageFile);
        questionImageId = uploadResponse.$id;
      }

      // Handle option images
      const uploadedOptionImages = await Promise.all(
        optionImageFiles.map(async (file, index) => {
          if (file) {
            // Delete old image if editing
            if (editingId && formData.options_image[index]) {
              try {
                await storage.deleteFile(BUCKET_ID, formData.options_image[index]);
              } catch (err) {
                console.error("Error deleting old option image:", err.message);
              }
            }
            const uploadResponse = await storage.createFile(BUCKET_ID, ID.unique(), file);
            return uploadResponse.$id;
          }
          return formData.options_image[index] || '';
        })
      );

      // Create or update document
      if (editingId) {
        await databases.updateDocument(
          databaseId, 
          collectionId,
          editingId,
          {
            ...formData,
            image_id: questionImageId,
            options_text: formData.options_text.filter(opt => opt.trim() !== ''),
            options_image: uploadedOptionImages,
            tags: formData.tags
          }
        );
      } else {
        await databases.createDocument(
          databaseId, 
          collectionId,
          ID.unique(),
          {
            ...formData,
            image_id: questionImageId,
            options_text: formData.options_text.filter(opt => opt.trim() !== ''),
            options_image: uploadedOptionImages,
            tags: formData.tags
          }
        );
      }
      
      await fetchQuestions();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question) => {
    setEditingId(question.$id);
    setFormData({
      question_id: question.question_id,
      text: question.text,
      image_id: question.image_id,
      options_text: question.options_text || ['', '', '', ''],
      options_image: question.options_image || ['', '', '', ''],
      correct_answer: question.correct_answer || 0,
      difficulty: question.difficulty || 'easy',
      tags: question.tags || [],
      created_by: question.created_by || 'test-user'
    });
    setQuestionImagePreview(question.imageUrl || null);
    setOptionImagePreviews(question.optionsImageUrls || [null, null, null, null]);
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    
    setLoading(true);
    try {
      // First get the question to delete its images
      const questionToDelete = questions.find(q => q.$id === questionId);
      
      // Delete question image if exists
      if (questionToDelete.image_id) {
        try {
          await storage.deleteFile(BUCKET_ID, questionToDelete.image_id);
        } catch (err) {
          console.error("Error deleting question image:", err.message);
        }
      }
      
      // Delete option images if exist
      await Promise.all(
        questionToDelete.options_image.map(async (imgId) => {
          if (imgId) {
            try {
              await storage.deleteFile(BUCKET_ID, imgId);
            } catch (err) {
              console.error("Error deleting option image:", err.message);
            }
          }
        })
      );
      
      // Delete the document
      await databases.deleteDocument(databaseId, collectionId, questionId);
      await fetchQuestions();
      
      // Reset form if editing the deleted question
      if (editingId === questionId) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question_id: '',
      text: '',
      image_id: '',
      options_text: ['', '', '', ''],
      options_image: ['', '', '', ''],
      correct_answer: 0,
      difficulty: 'easy',
      tags: [],
      created_by: 'test-user'
    });
    setOptionImageFiles([null, null, null, null]);
    setQuestionImageFile(null);
    setNewTag('');
    setEditingId(null);
    setQuestionImagePreview(null);
    setOptionImagePreviews([null, null, null, null]);
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

  const handleQuestionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQuestionImageFile(file);
      setQuestionImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOptionImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const newOptionFiles = [...optionImageFiles];
      newOptionFiles[index] = file;
      setOptionImageFiles(newOptionFiles);
      
      const newPreviews = [...optionImagePreviews];
      newPreviews[index] = URL.createObjectURL(file);
      setOptionImagePreviews(newPreviews);
    }
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Questions Management</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Question' : 'Add New Question'}
          </h2>
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
                disabled={editingId}
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
              <label className="block mb-2">Question Image</label>
              <input
                type="file"
                onChange={handleQuestionImageChange}
                className="w-full p-2 border rounded"
                accept="image/*"
              />
              {questionImagePreview && (
                <div className="mt-2">
                  <img 
                    src={questionImagePreview} 
                    alt="Preview" 
                    className="max-h-40 w-auto rounded border"
                  />
                  <p className="text-sm text-gray-500 mt-1">Image preview</p>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block mb-2">Options</label>
              {formData.options_text.map((option, index) => (
                <div key={index} className="mb-4 p-3 border rounded-lg">
                  <div className="mb-2">
                    <label className="block text-sm text-gray-600 mb-1">Option {index + 1} Text</label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm text-gray-600 mb-1">Option {index + 1} Image</label>
                    <input
                      type="file"
                      onChange={(e) => handleOptionImageChange(index, e)}
                      className="w-full p-2 border rounded"
                      accept="image/*"
                    />
                    {optionImagePreviews[index] && (
                      <div className="mt-2">
                        <img 
                          src={optionImagePreviews[index]} 
                          alt={`Option ${index + 1} preview`} 
                          className="max-h-20 w-auto rounded border"
                        />
                        <p className="text-sm text-gray-500">Image preview</p>
                      </div>
                    )}
                  </div>
                  
                  <label className="inline-flex items-center mt-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={formData.correct_answer === index}
                      onChange={() => setFormData(prev => ({ ...prev, correct_answer: index }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Correct Answer</span>
                  </label>
                </div>
              ))}
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
                  className="bg-gray-200 px-4 rounded-r hover:bg-gray-300"
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
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
              >
                {loading ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Data Display */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions List</h2>
            <button 
              onClick={fetchQuestions}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p>No questions found</p>
          ) : (
            <div className="space-y-4">
              {questions.map(question => (
                <div 
                  key={question.$id} 
                  className="border p-4 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(question)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{question.question_id}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuestion(question.$id);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(question.$createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    {question.text && (
                      <p className="text-gray-700 mb-3">{question.text}</p>
                    )}
                    
                    {question.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={question.imageUrl} 
                          alt="Question" 
                          className="max-h-40 w-auto rounded border"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {question.options_text?.map((option, index) => (
                        <div 
                          key={index} 
                          className={`p-2 rounded text-sm ${
                            question.correct_answer === index ? 
                            'bg-green-100 text-green-800 border border-green-300' : 
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p>Option {index + 1}: {option || "N/A"}</p>
                            </div>
                            {question.optionsImageUrls[index] && (
                              <div className="w-16 h-16 flex-shrink-0">
                                <img 
                                  src={question.optionsImageUrls[index]} 
                                  alt={`Option ${index + 1}`} 
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {question.tags && question.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {question.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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