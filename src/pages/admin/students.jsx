import React, { useState, useEffect, useRef } from "react";
import { databases, account } from "../../utils/appwrite";
import { ID } from "appwrite";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [user, setUser] = useState(null);
  const modalRef = useRef(null);
  const viewModalRef = useRef(null);

  const initialFormData = {
    name: "",
    email: "",
    password: "",
    student_id: "",
    status: "active",
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchStudents();
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const loggedInUser = await account.get();
      setUser(loggedInUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Failed to fetch user information.");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
      );

      const formattedStudents = response.documents.map((student) => ({
        id: student.$id,
        name: student.name,
        email: student.email,
        password: student.password,
        student_id: student.student_id,
        status: student.status,
        registered_by: student.registered_by || "Unknown",
        registered_date: student.$createdAt
          ? new Date(student.$createdAt).toLocaleDateString()
          : "Not Available",
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.student_id) {
      setError("Please provide Name, Email, and Student ID.");
      return false;
    }
    if (!editingStudent && !formData.password) {
      setError("Password is required for new students.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    try {
      const studentData = {
        name: formData.name,
        email: formData.email,
        student_id: formData.student_id,
        status: formData.status,
        registered_by: user?.name || "Admin",
      };

      // Only include password if provided (for new students or when updating password)
      if (formData.password) {
        studentData.password = formData.password;
      } else if (editingStudent) {
        // Keep existing password if not changed
        studentData.password = editingStudent.password;
      }

      if (editingStudent) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
          editingStudent.id,
          studentData
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
          ID.unique(),
          studentData
        );
      }

      closeModal();
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      setError(`Error saving student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user || !user.labels.includes("admin")) {
      setError("You do not have permission to delete students.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this student?")) return;

    setLoading(true);
    setError(null);
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        id
      );
      fetchStudents();
      if (editingStudent && editingStudent.id === id) {
        closeModal();
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      setError(`Error deleting student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: "", // Don't prefill password
      student_id: student.student_id,
      status: student.status,
    });
    setModalOpen(true);
  };

  const handleView = (student) => {
    setViewingStudent(student);
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
    setFormData(initialFormData);
    setError(null);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingStudent(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
      if (viewModalRef.current && !viewModalRef.current.contains(event.target)) {
        closeViewModal();
      }
    };

    if (modalOpen || viewModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalOpen, viewModalOpen]);

  const ActionButtons = ({ student }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600 transition-colors"
        onClick={() => handleView(student)}
        title="View"
        aria-label="View student"
      >
        <Eye size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <button
        className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600 transition-colors"
        onClick={() => handleEdit(student)}
        title="Edit"
        aria-label="Edit student"
      >
        <Edit size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <button
        className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
        onClick={() => handleDelete(student.id)}
        title="Delete"
        aria-label="Delete student"
      >
        <Trash2 size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Manage Students</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded mb-2 sm:mb-0 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading students...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Student ID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                    >
                      Registered By
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden sm:table-cell">
                        {student.email}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500">
                        {student.student_id}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden sm:table-cell">
                        {student.status}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden md:table-cell">
                        {student.registered_by}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500">
                        <ActionButtons student={student} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingStudent ? "Edit Student" : "Add Student"}
            </h3>
            <form>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange(e, "name")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e, "email")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e, "password")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={editingStudent ? "Leave blank to keep current" : ""}
                  required={!editingStudent}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">
                  Student ID
                </label>
                <input
                  type="text"
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange(e, "student_id")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                  disabled={editingStudent}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange(e, "status")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div ref={viewModalRef} className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">View Student</h3>
            <div className="mb-4">
              <p>
                <strong>Name:</strong> {viewingStudent.name}
              </p>
              <p>
                <strong>Email:</strong> {viewingStudent.email}
              </p>
              <p>
                <strong>Student ID:</strong> {viewingStudent.student_id}
              </p>
              <p>
                <strong>Status:</strong> {viewingStudent.status}
              </p>
              <p>
                <strong>Registered By:</strong> {viewingStudent.registered_by}
              </p>
              <p>
                <strong>Registered Date:</strong> {viewingStudent.registered_date}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeViewModal}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;