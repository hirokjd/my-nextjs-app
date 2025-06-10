import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { ID, Query } from 'appwrite';

const ExamEnrollmentsTestPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    enrollment_id: ID.unique(),
    student_id: '',
    exam_id: '',
    enrolled_at: new Date().toISOString()
  });
  const [editingId, setEditingId] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'exam_enrollments';

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [enrollmentsRes, examsRes, studentsRes] = await Promise.all([
        databases.listDocuments(databaseId, collectionId, [Query.limit(100), Query.orderDesc('enrolled_at')]),
        databases.listDocuments(databaseId, 'exams', [Query.limit(100)]),
        databases.listDocuments(databaseId, 'students', [Query.limit(100)])
      ]);

      setEnrollments(enrollmentsRes.documents);
      setExams(examsRes.documents);
      setStudents(studentsRes.documents);
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

  const getStudentName = (studentId) => {
    const resolvedId = resolveRelationshipId(studentId);
    const student = students.find(s => s.$id === resolvedId || s.student_id === resolvedId);
    if (student) {
      return `${student.name} (${student.email})`;
    }
    return 'Unknown Student';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
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
        enrollment_id: formData.enrollment_id,
        student_id: [formData.student_id],
        exam_id: [formData.exam_id],
        enrolled_at: formData.enrolled_at
      };

      if (editingId) {
        await databases.updateDocument(databaseId, collectionId, editingId, data);
      } else {
        await databases.createDocument(databaseId, collectionId, ID.unique(), {
          ...data,
          enrollment_id: ID.unique() // Generate new ID for new records
        });
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

  const handleEdit = (enrollment) => {
    setFormData({
      enrollment_id: enrollment.enrollment_id || ID.unique(),
      student_id: resolveRelationshipId(enrollment.student_id) || '',
      exam_id: resolveRelationshipId(enrollment.exam_id) || '',
      enrolled_at: enrollment.enrolled_at || new Date().toISOString()
    });
    setEditingId(enrollment.$id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
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
      enrollment_id: ID.unique(),
      student_id: '',
      exam_id: '',
      enrolled_at: new Date().toISOString()
    });
    setEditingId(null);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exam Enrollments Management</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Enrollment' : 'Add New Enrollment'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment ID</label>
                <input
                  type="text"
                  name="enrollment_id"
                  value={formData.enrollment_id}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
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
                {exams.map((exam) => (
                  <option key={exam.$id} value={exam.$id}>
                    {exam.name} ({exam.exam_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
              <input
                type="datetime-local"
                name="enrolled_at"
                value={formData.enrolled_at ? formData.enrolled_at.substring(0, 16) : ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                required
                disabled={loading}
              />
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
            <h2 className="text-xl font-semibold">Exam Enrollments List</h2>
            <div className="flex space-x-2">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
              >
                {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
              </button>
            </div>
          </div>

          {loading && enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p>Loading enrollments...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p>No enrollments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.$id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{getStudentName(enrollment.student_id)}</h3>
                      <p className="text-sm text-gray-600">
                        Enrolled in: {getExamName(enrollment.exam_id)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Enrollment ID: {enrollment.enrollment_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Enrolled at: {formatDate(enrollment.enrolled_at)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(enrollment.enrolled_at)}
                    </div>
                  </div>

                  {showRawData && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                      <pre>{JSON.stringify(enrollment, null, 2)}</pre>
                    </div>
                  )}

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleEdit(enrollment)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(enrollment.$id)}
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

export default ExamEnrollmentsTestPage;