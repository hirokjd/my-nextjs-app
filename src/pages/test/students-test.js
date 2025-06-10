// pages/students-test.js
import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID } from 'appwrite';

const StudentsTestPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    password: '',
    status: 'active',
    registered_at: new Date().toISOString(),
    registered_by: 'test-user'
  });
  const [editingId, setEditingId] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'students';

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setStudents(response.documents);
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
        // Update existing student
        await databases.updateDocument(
          databaseId,
          collectionId,
          editingId,
          {
            ...formData,
            // Don't update password unless it's changed (you might want to add password change logic)
            password: formData.password || students.find(s => s.$id === editingId).password
          }
        );
      } else {
        // Create new student
        await databases.createDocument(
          databaseId, 
          collectionId,
          ID.unique(),
          formData
        );
      }
      await fetchStudents();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      password: '', // Don't show password when editing (or you could show a placeholder)
      status: student.status,
      registered_at: student.registered_at,
      registered_by: student.registered_by
    });
    setEditingId(student.$id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    setLoading(true);
    try {
      await databases.deleteDocument(databaseId, collectionId, id);
      await fetchStudents();
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
      student_id: '',
      name: '',
      email: '',
      password: '',
      status: 'active',
      registered_at: new Date().toISOString(),
      registered_by: 'test-user'
    });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Students Management</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2">Student ID</label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                disabled={editingId} // Disable editing of student_id
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Name</label>
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
              <label className="block mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder={editingId ? "Leave blank to keep current" : ""}
                required={!editingId}
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
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
              >
                {loading ? 'Saving...' : editingId ? 'Update Student' : 'Add Student'}
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
            <h2 className="text-xl font-semibold">Students List</h2>
            <button 
              onClick={fetchStudents}
              disabled={loading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <p>Loading students...</p>
          ) : students.length === 0 ? (
            <p>No students found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.$id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{student.student_id}</td>
                      <td className="p-2">{student.name}</td>
                      <td className="p-2">{student.email}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(student.$id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsTestPage;