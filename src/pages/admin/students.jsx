import React, { useState, useEffect, useRef } from "react";
import { databases, account } from "../../utils/appwrite";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.student_id) {
      alert("Please provide Name, Email, and Student ID.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const studentData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        student_id: formData.student_id,
        status: formData.status,
        registered_by: user?.name || "Admin",
      };

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
          "unique()",
          studentData
        );
      }

      closeModal();
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!user || user.labels !== "admin") {
      alert("You do not have permission to delete students.");
      return;
    }

    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        id
      );
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error.message);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: student.password,
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
    <div className="flex items-center gap-2">
      <button
        className="btn-action btn-outline-action"
        onClick={() => handleView(student)}
        title="View"
        aria-label="View student"
      >
        <Eye size={16} />
      </button>
      <button
        className="btn-action btn-outline-action"
        onClick={() => handleEdit(student)}
        title="Edit"
        aria-label="Edit student"
      >
        <Edit size={16} />
      </button>
      <button
        className="btn-action btn-danger-action"
        onClick={() => handleDelete(student.id)}
        title="Delete"
        aria-label="Delete student"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Manage Students</h2>
        <button
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} /> 
          <span>Add Student</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-muted">Loading students...</p>
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted-light">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider hidden md:table-cell">
                    Registered By
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-muted-light/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">
                      {student.name}
                      <div className="text-xs text-muted sm:hidden">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted hidden sm:table-cell">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted hidden sm:table-cell">
                      <span className={`status-badge ${
                        student.status === 'active' 
                          ? 'status-badge-active' 
                          : 'status-badge-inactive'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted hidden md:table-cell">
                      {student.registered_by}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <ActionButtons student={student} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div
            ref={modalRef}
            className="card p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">{editingStudent ? "Edit Student" : "Add Student"}</h3>
            <form>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange(e, "name")}
                  className="form-input mt-1 block w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e, "email")}
                  className="form-input mt-1 block w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="student_id" className="block text-sm font-medium">Student ID</label>
                <input
                  type="text"
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange(e, "student_id")}
                  className="form-input mt-1 block w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange(e, "status")}
                  className="form-select mt-1 block w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div
            ref={viewModalRef}
            className="card p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">View Student</h3>
            <div className="mb-4 space-y-2">
              <p><span className="font-medium">Name:</span> {viewingStudent.name}</p>
              <p><span className="font-medium">Email:</span> {viewingStudent.email}</p>
              <p><span className="font-medium">Student ID:</span> {viewingStudent.student_id}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`status-badge ml-2 ${
                  viewingStudent.status === 'active' 
                    ? 'status-badge-active' 
                    : 'status-badge-inactive'
                }`}>
                  {viewingStudent.status.toUpperCase()}
                </span>
              </p>
              <p><span className="font-medium">Registered By:</span> {viewingStudent.registered_by}</p>
              <p><span className="font-medium">Registered Date:</span> {viewingStudent.registered_date}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeViewModal}
                className="btn btn-outline"
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
