import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react";
import { databases, account, ID, Query } from "../../utils/appwrite";
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { React as ReactLazy } from "react";
import { lazy } from "react";
import Modal from "../../components/Modal";

const STUDENTS_PER_PAGE = 20;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const exportButtonRef = useRef(null);

  const DATABASE_ID = "67a5a946002e8a51f8fe";
  const STUDENTS_COLLECTION_ID = "students";
  const COURSES_COLLECTION_ID = "course";

  const initialFormData = {
    name: "",
    email: "",
    password: "",
    status: "active",
    course_id: "",
    student_id: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === "object" && field.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) {
      const id = field[0]?.$id || field[0];
      return id;
    }
    return field;
  };

  const getCourseName = async (courseId, retry = false) => {
    const resolvedId = resolveRelationshipId(courseId);
    if (!resolvedId) return "Not assigned";
    let course = courses.find((c) => c.$id === resolvedId);
    if (!course && !retry) {
      try {
        const coursesRes = await databases.listDocuments(DATABASE_ID, COURSES_COLLECTION_ID, [
          Query.equal("status", "active"),
          Query.limit(100),
        ]);
        setCourses(coursesRes.documents);
        course = coursesRes.documents.find((c) => c.$id === resolvedId);
        if (course) return course.course_name;
      } catch (error) {
        console.error("getCourseName: Error refetching courses", error);
      }
      return "Not assigned";
    }
    return course ? course.course_name : "Not assigned";
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [coursesRes, studentsRes, userRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COURSES_COLLECTION_ID, [
          Query.equal("status", "active"),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID, [
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]),
        account.get(),
      ]);

      console.log("Fetched courses:", coursesRes.documents.map((c) => ({
        id: c.$id,
        name: c.course_name,
      })));
      setCourses(coursesRes.documents);
      setUser(userRes);

      const formattedStudents = await Promise.all(
        studentsRes.documents.map(async (student) => ({
          id: student.$id,
          name: student.name,
          email: student.email,
          password: student.password || "",
          student_id: student.student_id,
          status: student.status,
          course_id: resolveRelationshipId(student.course_id),
          course_name: await getCourseName(student.course_id),
          raw_course_id: student.course_id,
          registered_by: student.registered_by || userRes?.name || "Unknown",
          registered_date: student.registered_at
            ? new Date(student.registered_at).toLocaleDateString()
            : new Date(student.$createdAt).toLocaleDateString(),
        }))
      );

      console.log("Formatted students:", formattedStudents.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        course_id: s.course_id,
        course_name: s.course_name,
        raw_course_id: s.raw_course_id,
      })));
      setStudents(formattedStudents);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportMenuOpen]);

  const generateStudentId = (courseId) => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000000000 + Math.random() * 900000000000).toString().padStart(12, '0');
    if (!courseId) return `STUD-${year}-${randomNum}`;
    const course = courses.find((c) => c.$id === courseId);
    if (!course) return `STUD-${year}-${randomNum}`;
    const courseName = course.course_name.replace(/[^a-zA-Z0-9]/g, "");
    const coursePrefix = courseName.slice(0, 3).toUpperCase();
    return `${coursePrefix}-${year}-${randomNum}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "course_id" ? { student_id: generateStudentId(value) } : {}),
    }));
    if (error) setError("");
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
    if (!editingStudent && !formData.password) {
      setError("Password is required for new students");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");
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
        await databases.updateDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, editingStudent.id, studentData);
      } else {
        await databases.createDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, ID.unique(), studentData);
      }
      await fetchAllData();
      closeModal();
    } catch (error) {
      console.error("Error saving student:", error);
      setError(`Error saving student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) return;
    setLoading(true);
    try {
      await Promise.all(
        selectedStudents.map((studentId) =>
          databases.deleteDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, studentId)
        )
      );
      setSelectedStudents([]);
      await fetchAllData();
    } catch (error) {
      console.error("Bulk delete error:", error);
      setError("Failed to delete selected students");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(displayedStudents.map((student) => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    setLoading(true);
    setError("");
    try {
      await databases.deleteDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, id);
      await fetchAllData();
      if (editingStudent && editingStudent.id === id) closeModal();
    } catch (error) {
      console.error("Error deleting student:", error);
      setError(`Error deleting student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setIsExportMenuOpen(false);
    if (filteredStudents.length === 0) {
      setError("No students available to export.");
      return;
    }
    try {
      const exportData = filteredStudents.map((student) => ({
        "Student ID": student.student_id,
        Name: student.name,
        Email: student.email,
        Course: student.course_name || "Not assigned",
        Status: student.status,
        Password: student.password || "",
        "Registered By": student.registered_by,
        "Registration Date": student.registered_date,
      }));
      if (format === "csv") {
        const { Parser } = await import("json2csv");
        const fields = ["Student ID", "Name", "Email", "Course", "Status", "Password", "Registered By", "Registration Date"];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `students_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "xls") {
        const { utils, writeFile } = await import("xlsx");
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Students");
        writeFile(wb, `students_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      setError(`Failed to export to ${format.toUpperCase()}: ${error.message}`);
    }
  };

  const openModal = (student = null) => {
    setError("");
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        password: student.password || "",
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
    setError("");
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
      type: "text",
      required: !editingStudent,
      placeholder: editingStudent ? "Leave blank to keep current" : "Enter password",
    },
    {
      name: "course_id",
      label: "Course",
      type: "select",
      options: courses.map((course) => ({ value: course.$id, label: course.course_name })),
      required: false,
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

  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        (filterCourseId === "" || student.course_id === filterCourseId) &&
        (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         student.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [students, searchTerm, filterCourseId]);

  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  const indexOfLastStudent = currentPage * STUDENTS_PER_PAGE;
  const indexOfFirstStudent = indexOfLastStudent - STUDENTS_PER_PAGE;
  const displayedStudents = useMemo(
    () => filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent),
    [filteredStudents, indexOfFirstStudent, indexOfLastStudent]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSelectedStudents([]);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedStudents([]);
  };

  const allStudentsSelected = displayedStudents.length > 0 && selectedStudents.length === displayedStudents.length;

  const truncateCourseName = (name) => {
    if (!name || name === "Not assigned") return name;
    return name.length > 18 ? `${name.slice(0, 15)}...` : name;
  };

  const truncateStudentId = (id) => {
    if (!id) return id;
    return id.length > 15 ? `${id.slice(0, 12)}...` : id;
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Manage Students</h2>
          <div className="flex flex-wrap gap-2">
            {selectedStudents.length > 0 && (
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                onClick={handleBulkDelete}
                disabled={loading}
              >
                <Trash2 size={18} />
                <span>Delete Selected ({selectedStudents.length})</span>
              </button>
            )}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
              onClick={() => {
                if (!user) {
                  setError("User data is still loading. Please wait before adding a student.");
                  return;
                }
                openModal();
              }}
              disabled={loading || !user}
            >
              <Plus size={18} />
              <span>Add Student</span>
            </button>
            <div className="relative" ref={exportButtonRef}>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                <Download size={18} />
                <span>Export</span>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleExport("csv")}
                  >
                    Export to CSV
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => handleExport("xls")}
                  >
                    Export to XLS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label htmlFor="course_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Course:</label>
          <select
            id="course_filter"
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.$id} value={course.$id}>
                {course.course_name}
              </option>
            ))}
          </select>
          {filterCourseId && (
            <button
              onClick={() => setFilterCourseId("")}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"
            >
              <X size={16} />
              Clear Filter
            </button>
          )}
          <div className="relative flex-grow sm:ml-4 w-full sm:w-auto">
            <label htmlFor="main_search" className="sr-only">Search Students</label>
            <input
              type="text"
              id="main_search"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50 pl-10"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        onChange={handleSelectAll}
                        checked={allStudentsSelected}
                        disabled={displayedStudents.length === 0}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedStudents.length > 0 ? (
                    displayedStudents.map((student, index) => (
                      <tr key={student.id} className={`hover:bg-gray-50 transition-colors duration-150 ${student.status === "inactive" ? "bg-gray-100 opacity-70" : ""}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleSelectStudent(student.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{indexOfFirstStudent + index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{student.email}</div>
                          <div className="text-xs text-gray-500 sm:hidden">{truncateCourseName(student.course_name)}</div>
                          <div className="text-xs text-gray-500 sm:hidden">Status: {student.status}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{truncateStudentId(student.student_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{truncateCourseName(student.course_name)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 transition-colors duration-200"
                              onClick={() => openViewModal(student)}
                              title="View"
                            >
                              <Eye size={16} className="w-4 h-4" />
                            </button>
                            <button
                              className="bg-yellow-500 text-white p-1 rounded-md hover:bg-yellow-600 transition-colors duration-200"
                              onClick={() => openModal(student)}
                              title="Edit"
                            >
                              <Edit size={16} className="w-4 h-4" />
                            </button>
                            <button
                              className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors duration-200"
                              onClick={() => handleDelete(student.id)}
                              title="Delete"
                            >
                              <Trash2 size={16} className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-gray-500 text-lg">
                        {searchTerm || filterCourseId ? "No students match your search or filter." : "No students found."}
                      </td>
                    </tr>
                  )}
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
          <Suspense fallback={<div className="flex justify-center items-center h-32">Loading...</div>}>
          <Modal
            title={editingStudent ? "Edit Student" : "Add New Student"}
            onClose={closeModal}
            onSave={handleSave}
            initialData={formData}
            fields={modalFields}
            isLoading={loading}
            error={error}
            onChange={handleInputChange}
            customPosition={modalPosition}
          />
          </Suspense>
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
                  <label className="block text-sm font-medium text-gray-700">Password:</label>
                  <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingStudent.password || "N/A"}</p>
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