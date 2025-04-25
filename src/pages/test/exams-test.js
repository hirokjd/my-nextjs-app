// pages/exams-test.js
import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID } from 'appwrite';

const ExamsTestPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    exam_id: '',
    name: '',
    description: '',
    exam_date: '',
    duration: 60,
    status: 'active',
    created_by: 'test-user'
  });
  const [editingId, setEditingId] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'exams';

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setExams(response.documents);
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
      if (editingId) {
        // Update existing exam
        await databases.updateDocument(
          databaseId,
          collectionId,
          editingId,
          {
            ...formData,
            duration: parseInt(formData.duration),
            modified_at: new Date().toISOString()
          }
        );
      } else {
        // Create new exam
        await databases.createDocument(
          databaseId, 
          collectionId,
          ID.unique(),
          {
            ...formData,
            duration: parseInt(formData.duration),
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString()
          }
        );
      }
      await fetchExams();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam) => {
    setFormData({
      exam_id: exam.exam_id,
      name: exam.name,
      description: exam.description,
      exam_date: exam.exam_date.substring(0, 16), // Format for datetime-local input
      duration: exam.duration,
      status: exam.status,
      created_by: exam.created_by
    });
    setEditingId(exam.$id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    
    setLoading(true);
    try {
      await databases.deleteDocument(databaseId, collectionId, id);
      await fetchExams();
      if (editingId === id) {
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
      exam_id: '',
      name: '',
      description: '',
      exam_date: '',
      duration: 60,
      status: 'active',
      created_by: 'test-user'
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exams Management</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Exam' : 'Add New Exam'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2">Exam ID</label>
              <input
                type="text"
                name="exam_id"
                value={formData.exam_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                disabled={editingId} // Disable editing of exam_id
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Exam Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Exam Date</label>
              <input
                type="datetime-local"
                name="exam_date"
                value={formData.exam_date}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
              >
                {loading ? 'Saving...' : editingId ? 'Update Exam' : 'Add Exam'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
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
            <h2 className="text-xl font-semibold">Exams List</h2>
            <button 
              onClick={fetchExams}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p>Loading exams...</p>
          ) : exams.length === 0 ? (
            <p>No exams found</p>
          ) : (
            <div className="space-y-4">
              {exams.map(exam => (
                <div key={exam.$id} className="border p-4 rounded hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{exam.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(exam)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exam.$id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">ID: {exam.exam_id}</p>
                    <p className="text-sm">Date: {formatDate(exam.exam_date)}</p>
                    <p className="text-sm">Duration: {exam.duration} minutes</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${
                      exam.status === 'active' ? 'bg-green-100 text-green-800' :
                      exam.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exam.status}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="mt-2 text-sm text-gray-700">{exam.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamsTestPage;