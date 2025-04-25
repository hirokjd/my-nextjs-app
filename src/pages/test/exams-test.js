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
      await fetchExams();
      setFormData({
        exam_id: '',
        name: '',
        description: '',
        exam_date: '',
        duration: 60,
        status: 'active',
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exams Collection Test</h1>
      
      {error && <div className="bg-red-100 p-4 mb-4 rounded">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Exam</h2>
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
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Exam'}
            </button>
          </form>
        </div>
        
        {/* Data Display */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Exams List</h2>
          {loading ? (
            <p>Loading exams...</p>
          ) : exams.length === 0 ? (
            <p>No exams found</p>
          ) : (
            <div className="space-y-4">
              {exams.map(exam => (
                <div key={exam.$id} className="border p-4 rounded">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{exam.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      exam.status === 'active' ? 'bg-green-100 text-green-800' :
                      exam.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exam.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">ID: {exam.exam_id}</p>
                    <p className="text-sm">Date: {formatDate(exam.exam_date)}</p>
                    <p className="text-sm">Duration: {exam.duration} minutes</p>
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