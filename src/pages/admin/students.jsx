import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { databases, account, ID, Query } from "../../utils/appwrite";
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "../../components/Modal";

const STUDENTS_PER_PAGE = 20;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
  const COURSE_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COURSE_COLLECTION_ID;

  const initialFormData = {
    name: "",
    email: "",
    password: "",
    status: "active",
    course_id: "",
    student_id: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, COURSE_COLLECTION_ID, [
        Query.equal("status", "active"),
        Query.orderDesc("$createdAt"),
      ]);
      setCourses(response.documents);
      return response.documents;
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to fetch courses: " + error.message);
      return [];
    }
  }, [DATABASE_ID, COURSE_COLLECTION_ID]);

  const fetchStudents = useCallback(
    async (coursesData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID, [
          Query.orderDesc("$createdAt"),
        ]);

        const formattedStudents = response.documents.map((student) => {
          const course = coursesData.find((c) => c.$id === student.course_id);
          return {
            id: student.$id,
            name: student.name,
            email: student.email,
            password: student.password,
            student_id: student.student_id,
            status: student.status,
            course_id: student.course_id || null,
            course_name: course?.course_name || "Not assigned",
            registered_by: student.registered_by || "Unknown",
            registered_date: student.registered_at
              ? new Date(student.registered_at).toLocaleDateString()
              : new Date(student.$createdAt).toLocaleDateString(),
          };
        });

        setStudents(formattedStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError("Failed to fetch students: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [DATABASE_ID, STUDENTS_COLLECTION_ID]
  );

  const getUser = useCallback(async () => {
    try {
      const loggedInUser = await account.get();
      setUser(loggedInUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Failed to fetch user information.");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const coursesData = await fetchCourses();
        await Promise.all([fetchStudents(coursesData), getUser()]);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load initial data");
        setLoading(false);
      }
    };
    loadData();
  }, [fetchCourses, fetchStudents, getUser]);

  const generateStudentId = (courseId) => {
    if (!courseId) return "";
    const course = courses.find((c) => c.$id === courseId);
    if (!course) return "";

    const coursePrefix = course.course_name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${coursePrefix}-${year}-${randomNum}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      if (name === "course_id") {
        newFormData.student_id = generateStudentId(value);
      }
      return newFormData;
    });
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please provide a name");
      return false;
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Please provide a valid email");
      return false;
    }
    if (!formData.course_id) {
      setError("Please select a course");
      return false;
    }
    if (!editingStudent && !formData.password) {
      setError("Password is required for new students");
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
        name: formData.name.trim(),
        email: formData.email.trim(),
        student_id: formData.student_id || generateStudentId(formData.course_id),
        status: formData.status,
        course_id: formData.course_id || null,
        registered_by: user?.$id || "Admin",
        registered_at: new Date().toISOString(),
      };

      if (formData.password) {
        studentData.password = formData.password;
      }

      if (editingStudent) {
        await databases.updateDocument(
          DATABASE_ID,
          STUDENTS_COLLECTION_ID,
          editingStudent.id,
          studentData
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          STUDENTS_COLLECTION_ID,
          ID.unique(),
          studentData
        );
      }

      closeModal();
      const coursesData = await fetchCourses();
      await fetchStudents(coursesData);
    } catch (error) {
      console.error("Error saving student:", error);
      setError(`Error saving student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    setLoading(true);
    setError(null);
    try {
      await databases.deleteDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, id);
      const coursesData = await fetchCourses();
      await fetchStudents(coursesData);
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

  const openModal = (student = null) => {
    setError(null);
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        password: "",
        student_id: student.student_id,
        status: student.status,
        course_id: student.course_id || "",
      });
    } else {
      setEditingStudent(null);
      setFormData(initialFormData);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStudent(null);
    setFormData(initialFormData);
    setError(null);
  };

  const openViewModal = (student) => {
    setViewingStudent(student);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingStudent(null);
  };

  const modalFields = [
    { name: "name", label: "Full Name*", type: "text", required: true, placeholder: "Enter full name" },
    { name: "email", label: "Email*", type: "email", required: true, placeholder: "Enter email" },
    {
      name: "password",
      label: `Password${editingStudent ? "" : "*"}`,
      type: "password",
      required: !editingStudent,
      placeholder: editingStudent ? "Leave blank to keep current" : "Enter password",
    },
    {
      name: "course_id",
      label: "Course*",
      type: "select",
      options: courses.map((course) => ({ value: course.$id, label: course.course_name })),
      required: true,
      disabled: courses.length === 0,
    },
    { name: "student_id", label: "Student ID", type: "text", readOnly: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["active", "inactive"],
      required: true,
    },
  ];

  const modalPosition = {
    top: "10vh",
    bottom: "10vh",
    left: "25vw",
    right: "15vw",
  };

  // Search and Pagination Logic
  const searchedStudents = useMemo(() => {
    if (!searchTerm) return students;
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(searchedStudents.length / STUDENTS_PER_PAGE);
  const indexOfLastStudent = currentPage * STUDENTS_PER_PAGE;
  const indexOfFirstStudent = indexOfLastStudent - STUDENTS_PER_PAGE;
  const displayedStudents = useMemo(
    () => searchedStudents.slice(indexOfFirstStudent, indexOfLastStudent),
    [searchedStudents, indexOfFirstStudent, indexOfLastStudent]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          onClick={() => {
            if (!user) {
              setError("User data is still loading. Please wait before adding a student.");
              return;
            }
            openModal();
          }}
          disabled={courses.length === 0 || !user}
        >
          <Plus size={18} />
          <span>Add Student</span>
        </button>
      </div>

      {error && !modalOpen && !viewModalOpen && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
          <p>{error}</p>
        </div>
      )}

      {loading && !displayedStudents.length && !error ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading students...</span>
        </div>
      ) : !displayedStudents.length && !error ? (
        <div className="text-center py-10">
          <p className="text-gray-500 text-lg">{searchTerm ? "No students match your search." : "No students found."}</p>
          {!searchTerm && <p className="text-gray-400">Get started by adding a new student.</p>}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sr. No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      student.status === "inactive" ? "bg-gray-100 opacity-70" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {indexOfFirstStudent + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.course_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          student.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openViewModal(student)}
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                          title="View Student"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openModal(student)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          title="Edit Student"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-4 py-2 rounded-md text-sm ${
                    currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <Modal
          title={editingStudent ? "Edit Student" : "Add New Student"}
          onClose={closeModal}
          onSave={() => handleSave()}
          initialData={formData}
          fields={modalFields}
          isLoading={loading}
          error={error}
          onChange={handleInputChange}
          customPosition={modalPosition}
        />
      )}

      {viewModalOpen && viewingStudent && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 transition-opacity flex items-center justify-center">
          <div
            className="bg-white rounded-lg shadow-xl p-6 overflow-y-auto"
            style={{ position: "fixed", top: modalPosition.top, left: modalPosition.left, right: modalPosition.right, bottom: modalPosition.bottom }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Student Details</h3>
              <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700" aria-label="Close modal">
                <XCircle size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.student_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.course_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded capitalize">{viewingStudent.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registered By:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.registered_by}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Date:</label>
                <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.registered_date}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeViewModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
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

const XCircle = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

export default Students;