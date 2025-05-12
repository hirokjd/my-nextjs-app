import React, { useState, useEffect, useRef } from "react";
import { databases } from "../../utils/appwrite";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

const ExamEnrollment = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [viewingEnrollment, setViewingEnrollment] = useState(null);
  const modalRef = useRef(null);
  const viewModalRef = useRef(null);

  const initialFormData = {
    student_id: "",
    exam_id: "",
    enrolled_at: new Date().toISOString().slice(0, 16)
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [enrollmentsResponse, studentsResponse, examsResponse] = await Promise.all([
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
        ),
        databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID
        )
      ]);

      // Create lookup maps for students and exams
      const studentMap = new Map();
      studentsResponse.documents.forEach(student => {
        studentMap.set(student.$id, student);
        if (student.student_id) {
          studentMap.set(student.student_id, student);
        }
      });

      const examMap = new Map();
      examsResponse.documents.forEach(exam => {
        examMap.set(exam.$id, exam);
        if (exam.exam_id) {
          examMap.set(exam.exam_id, exam);
        }
      });

      // Normalize enrollments with proper student and exam data
      const normalizedEnrollments = enrollmentsResponse.documents.map(enrollment => {
        // Try to find student by both possible ID fields
        const studentId = Array.isArray(enrollment.student_id) ? enrollment.student_id[0] : enrollment.student_id;
        const student = studentMap.get(studentId) || 
                       studentMap.get(studentId?.$id);
        
        // Try to find exam by both possible ID fields
        const examId = Array.isArray(enrollment.exam_id) ? enrollment.exam_id[0] : enrollment.exam_id;
        const exam = examMap.get(examId) || 
                    examMap.get(examId?.$id);

        return {
          id: enrollment.$id,
          enrollment_id: enrollment.enrollment_id,
          student_id: student?.$id || studentId,
          student_name: student?.name || 'Unknown Student',
          student_email: student?.email || '',
          exam_id: exam?.$id || examId,
          exam_name: exam?.name || 'Unknown Exam',
          exam_description: exam?.description || '',
          enrolled_at: enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleString() : 'N/A',
          raw_enrolled_at: enrollment.enrolled_at
        };
      });

      setEnrollments(normalizedEnrollments);
      setStudents(studentsResponse.documents);
      setExams(examsResponse.documents);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.student_id || !formData.exam_id) {
      alert("Please select both a student and an exam.");
      return false;
    }
    return true;
  };

  const generateEnrollmentId = () => {
    return `enr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const enrollmentData = {
        enrollment_id: editingEnrollment ? editingEnrollment.enrollment_id : generateEnrollmentId(),
        student_id: [formData.student_id], // Wrap in array for relationship
        exam_id: [formData.exam_id], // Wrap in array for relationship
        enrolled_at: formData.enrolled_at
      };

      if (editingEnrollment) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
          editingEnrollment.id,
          enrollmentData
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
          "unique()",
          enrollmentData
        );
      }

      closeModal();
      fetchAllData();
    } catch (error) {
      console.error("Error saving enrollment:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this enrollment?")) return;
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
        id
      );
      fetchAllData();
    } catch (error) {
      console.error("Error deleting enrollment:", error.message);
    }
  };

  const handleEdit = (enrollment) => {
    setEditingEnrollment(enrollment);
    setFormData({
      student_id: enrollment.student_id,
      exam_id: enrollment.exam_id,
      enrolled_at: enrollment.raw_enrolled_at ? 
        new Date(enrollment.raw_enrolled_at).toISOString().slice(0, 16) : 
        new Date().toISOString().slice(0, 16)
    });
    setModalOpen(true);
  };

  const handleView = (enrollment) => {
    setViewingEnrollment(enrollment);
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEnrollment(null);
    setFormData(initialFormData);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingEnrollment(null);
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

  const ActionButtons = ({ enrollment }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600 transition-colors"
        onClick={() => handleView(enrollment)}
        title="View"
        aria-label="View enrollment"
      >
        <Eye size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <button
        className="bg-yellow-500 text-white p-1 rounded hover:bg-yellow-600 transition-colors"
        onClick={() => handleEdit(enrollment)}
        title="Edit"
        aria-label="Edit enrollment"
      >
        <Edit size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
      <button
        className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
        onClick={() => handleDelete(enrollment.id)}
        title="Delete"
        aria-label="Delete enrollment"
      >
        <Trash2 size={16} className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Exam Enrollments</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded mb-2 sm:mb-0 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} className="w-3 h-3 sm:w-4 sm:h-4" /> 
          <span>Add Enrollment</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading enrollments...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Exam
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled At
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Enrollment ID
                    </th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm font-medium text-gray-900">
                        {enrollment.student_name}
                        <div className="text-xs text-gray-500 sm:hidden">{enrollment.exam_name}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden sm:table-cell">
                        {enrollment.exam_name}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500">
                        {enrollment.enrolled_at}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500 hidden md:table-cell">
                        {enrollment.enrollment_id}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-3 text-sm text-gray-500">
                        <ActionButtons enrollment={enrollment} />
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
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">{editingEnrollment ? "Edit Enrollment" : "Add Enrollment"}</h3>
            <form>
              <div className="mb-4">
                <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">Student</label>
                <select
                  id="student_id"
                  value={formData.student_id}
                  onChange={(e) => handleInputChange(e, "student_id")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.$id} value={student.$id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="exam_id" className="block text-sm font-medium text-gray-700">Exam</label>
                <select
                  id="exam_id"
                  value={formData.exam_id}
                  onChange={(e) => handleInputChange(e, "exam_id")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select Exam</option>
                  {exams.map(exam => (
                    <option key={exam.$id} value={exam.$id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="enrolled_at" className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                <input
                  type="datetime-local"
                  id="enrolled_at"
                  value={formData.enrolled_at}
                  onChange={(e) => handleInputChange(e, "enrolled_at")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
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
                >
                  {editingEnrollment ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOpen && viewingEnrollment && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
          <div
            ref={viewModalRef}
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Enrollment Details</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800">Student:</h4>
                <p>{viewingEnrollment.student_name} ({viewingEnrollment.student_email})</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Exam:</h4>
                <p>{viewingEnrollment.exam_name}</p>
                {viewingEnrollment.exam_description && (
                  <p className="text-sm text-gray-600">{viewingEnrollment.exam_description}</p>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Enrollment ID:</h4>
                <p>{viewingEnrollment.enrollment_id}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Enrolled At:</h4>
                <p>{viewingEnrollment.enrolled_at}</p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
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

export default ExamEnrollment;