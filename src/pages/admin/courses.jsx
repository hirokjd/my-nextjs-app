import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { Plus, Edit, Trash2, BookOpen, Eye, Search, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { databases, ID, account, Query } from "../../utils/appwrite";
import { formatDateTimeUTC, formatDateUTC, formatDateTimeIST } from "../../utils/date";
const Modal = React.lazy(() => import("../../components/Modal"));

const COURSES_PER_PAGE = 20;

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const exportButtonRef = useRef(null);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const COURSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COURSE_COLLECTION_ID;
  const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID;

  const initialFormData = {
    course_name: "",
    course_description: "",
    credit: "",
    status: "active",
  };
  const [formData, setFormData] = useState(initialFormData);

  const courseModalPosition = {
    top: '10vh',
    bottom: '10vh',
    left: '25vw',
    right: '15vw'
  };

  const fetchCurrentUser = useCallback(async () => {
    try {
      const user = await account.get();
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      setError("Could not fetch user details. Some operations might be affected.");
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COURSES_COLLECTION_ID,
        [Query.orderDesc("$createdAt")]
      );
      let coursesData = response.documents;

      const activeCourses = coursesData.filter(course => course.status !== 'inactive');
      const inactiveCourses = coursesData.filter(course => course.status === 'inactive');
      const sortedCoursesData = [...activeCourses, ...inactiveCourses];
      
      setCourses(sortedCoursesData);

      const creatorIds = [...new Set(coursesData.map(course => course.created_by).filter(Boolean))];
      const newNamesToFetch = {};
      for (const id of creatorIds) {
        if (!userNames[id] && id) {
          if (PROFILES_COLLECTION_ID && PROFILES_COLLECTION_ID !== 'YOUR_PROFILES_COLLECTION_ID') {
            try {
              const profileResponse = await databases.listDocuments(
                DATABASE_ID, PROFILES_COLLECTION_ID, [Query.equal('userId', id), Query.limit(1)]
              );
              if (profileResponse.documents.length > 0) newNamesToFetch[id] = profileResponse.documents[0].name;
              else newNamesToFetch[id] = id === currentUser?.$id ? currentUser.name : id;
            } catch (profileError) {
              console.warn(`Could not fetch profile for user ${id}:`, profileError);
              newNamesToFetch[id] = id === currentUser?.$id ? currentUser.name : id;
            }
          } else {
            newNamesToFetch[id] = id === currentUser?.$id ? currentUser.name : id;
          }
        }
      }
      if (Object.keys(newNamesToFetch).length > 0) {
        setUserNames(prevNames => ({ ...prevNames, ...newNamesToFetch }));
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [DATABASE_ID, COURSES_COLLECTION_ID, userNames, currentUser, PROFILES_COLLECTION_ID]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (PROFILES_COLLECTION_ID || currentUser) {
      fetchCourses();
    }
  }, [PROFILES_COLLECTION_ID, currentUser, fetchCourses]);

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

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const { course_name, course_description, credit, status } = formData;
    if (!course_name.trim()) { setError("Course Name is required."); return false; }
    if (course_name.trim().length < 3) { setError("Course Name must be at least 3 characters long."); return false; }
    if (course_name.length > 255) { setError("Course Name cannot exceed 255 characters."); return false; }
    if (course_description && course_description.length > 1000) { setError("Course Description cannot exceed 1000 characters."); return false; }
    if (credit !== "") {
      const creditValue = parseInt(credit, 10);
      if (isNaN(creditValue)) { setError("Credit must be a valid number."); return false; }
      if (creditValue < 0) { setError("Credit must be a non-negative number."); return false; }
      if (creditValue > 20) { setError("Credit value seems too high (max 20 recommended)."); return false; }
    }
    if (!status) { setError("Status is required."); return false;}
    setError(null);
    return true;
  };

  const openModal = (course = null) => {
    setError(null);
    if (course) {
      setEditingCourse(course);
      setFormData({
        course_name: course.course_name || "",
        course_description: course.course_description || "",
        credit: course.credit === null || course.credit === undefined ? "" : course.credit,
        status: course.status || "active",
      });
    } else {
      setEditingCourse(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    setFormData(initialFormData);
    setError(null);
  };

  const openViewModal = (course) => {
    setViewingCourse(course);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCourse(null);
  };

  const handleSaveCourse = async (currentFormData) => {
    setError(null);
    if (!validateForm()) return;

    setIsLoading(true);
    const dataToSave = {
      course_name: currentFormData.course_name.trim(),
      course_description: currentFormData.course_description ? currentFormData.course_description.trim() : null,
      credit: currentFormData.credit === "" || currentFormData.credit === null || currentFormData.credit === undefined ? null : parseInt(currentFormData.credit, 10),
      status: currentFormData.status,
    };

    try {
      if (editingCourse) {
        await databases.updateDocument(DATABASE_ID, COURSES_COLLECTION_ID, editingCourse.$id, dataToSave);
      } else {
        if (!currentUser || !currentUser.$id) {
          console.error("Current user or user ID is not available.", currentUser);
          setError("User information is not available. Cannot set 'created_by'. Please try refreshing the page or logging in again.");
          setIsLoading(false); return;
        }
        dataToSave.created_by = currentUser.$id;
        await databases.createDocument(DATABASE_ID, COURSES_COLLECTION_ID, ID.unique(), dataToSave);
      }
      await fetchCourses();
      closeModal();
    } catch (err) {
      console.error("Error saving course:", err);
      if (err.code && err.message) setError(`Appwrite Error (${err.code}): ${err.message}. Please check console for details.`);
      else setError(`Failed to save course: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    setIsLoading(true);
    setError(null);
    try {
      await databases.deleteDocument(DATABASE_ID, COURSES_COLLECTION_ID, courseId);
      await fetchCourses();
    } catch (err) {
      console.error("Error deleting course:", err);
      setError("Failed to delete course. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format) => {
    setIsExportMenuOpen(false);
    if (filteredCourses.length === 0) {
      setError("No courses available to export.");
      return;
    }
    try {
      const exportData = filteredCourses.map((course) => ({
        "Course Name": course.course_name,
        Description: course.course_description || "N/A",
        Credits: course.credit === null || course.credit === undefined ? "N/A" : course.credit,
        Status: course.status || "active",
        "Created By": userNames[course.created_by] || course.created_by || "N/A",
        "Created At": formatDateTimeUTC(course.$createdAt),
        "Last Updated": formatDateTimeUTC(course.$updatedAt),
      }));
      if (format === "csv") {
        const { Parser } = await import("json2csv");
        const fields = ["Course Name", "Description", "Credits", "Status", "Created By", "Created At", "Last Updated"];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `courses_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "xls") {
        const { utils, writeFile } = await import("xlsx");
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Courses");
        writeFile(wb, `courses_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      setError(`Failed to export to ${format.toUpperCase()}: ${error.message}`);
    }
  };

  const courseModalFields = [
    { name: "course_name", label: "Course Name*", type: "text", required: true, placeholder: "e.g., Introduction to Programming", maxLength: 255 },
    { name: "course_description", label: "Description", type: "textarea", placeholder: "Enter a brief description of the course (max 1000 chars)", rows: 4, maxLength: 1000 },
    { name: "credit", label: "Credits", type: "number", placeholder: "e.g., 3 (0-20)", min: 0, max: 20 },
    { name: "status", label: "Status*", type: "select", options: ["active", "inactive"], required: true },
  ];

  const filteredCourses = useMemo(() => {
    return courses.filter(course =>
      (filterStatus === "" || course.status === filterStatus) &&
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const indexOfLastCourse = currentPage * COURSES_PER_PAGE;
  const indexOfFirstCourse = indexOfLastCourse - COURSES_PER_PAGE;
  
  const displayedCourses = useMemo(() => {
    return filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  }, [filteredCourses, indexOfFirstCourse, indexOfLastCourse]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Manage Courses</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (!currentUser) { setError("User data is still loading. Please wait a moment before adding a course."); return; }
                openModal();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
              disabled={!currentUser || isLoading}
            >
              <Plus size={18} /> Add Course
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

        {error && !isModalOpen && !isViewModalOpen && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label htmlFor="status_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Status:</label>
          <select
            id="status_filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {filterStatus && (
            <button
              onClick={() => setFilterStatus("")}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"
            >
              <X size={16} />
              Clear Filter
            </button>
          )}
          <div className="relative flex-grow sm:ml-4 w-full sm:w-auto">
            <label htmlFor="main_search" className="sr-only">Search Courses</label>
            <input
              type="text"
              id="main_search"
              placeholder="Search by course name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50 pl-10"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" />
          </div>
        </div>

        {isLoading && !displayedCourses.length && !error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        ) : !displayedCourses.length && !error ? (
          <div className="text-center py-10">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">{searchTerm || filterStatus ? "No courses match your search or filter." : "No courses found."}</p>
            {!searchTerm && !filterStatus && <p className="text-gray-400">Get started by adding a new course.</p>}
          </div>
        ) : displayedCourses.length > 0 && !error ? (
          <>
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedCourses.map((course, index) => (
                    <tr key={course.$id} className={`hover:bg-gray-50 transition-colors ${course.status === 'inactive' ? 'bg-gray-100 opacity-70' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{indexOfFirstCourse + index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={course.course_name}>
                        {truncateText(course.course_name, 18)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{course.course_description || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credit === null || course.credit === undefined ? "N/A" : course.credit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {course.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userNames[course.created_by] || course.created_by || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => openViewModal(course)}
                            className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 transition-colors duration-200"
                            title="View"
                          >
                            <Eye size={16} className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(course)}
                            className="bg-yellow-500 text-white p-1 rounded-md hover:bg-yellow-600 transition-colors duration-200"
                            title="Edit"
                          >
                            <Edit size={16} className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.$id)}
                            className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} className="w-4 h-4" />
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`px-4 py-2 rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
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
        ) : null }

        {isModalOpen && (
          <Suspense fallback={<div className="flex justify-center items-center h-32">Loading...</div>}>
          <Modal
            title={editingCourse ? "Edit Course" : "Add New Course"}
            onClose={closeModal}
            onSave={() => handleSaveCourse(formData)}
            initialData={formData}
            fields={courseModalFields}
            isLoading={isLoading}
            error={error}
            onChange={handleInputChange}
            customPosition={courseModalPosition}
          />
          </Suspense>
        )}

        {isViewModalOpen && viewingCourse && (
          <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 transition-opacity flex items-center justify-center">
            <div 
              className="bg-white rounded-lg shadow-xl p-6 overflow-y-auto"
              style={{ position: 'fixed', top: courseModalPosition.top, left: courseModalPosition.left, right: courseModalPosition.right, bottom: courseModalPosition.bottom }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Course Details</h3>
                <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700" aria-label="Close modal"><XCircle size={24} /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Course Name:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingCourse.course_name}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Description:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded whitespace-pre-wrap">{viewingCourse.course_description || "N/A"}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Credits:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{viewingCourse.credit === null || viewingCourse.credit === undefined ? "N/A" : viewingCourse.credit}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Status:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded capitalize">{viewingCourse.status || "active"}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Created By:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{userNames[viewingCourse.created_by] || viewingCourse.created_by || "N/A"}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Created At:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{formatDateTimeIST(viewingCourse.$createdAt)}</p></div>
                <div><label className="block text-sm font-medium text-gray-700">Last Updated:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{formatDateTimeIST(viewingCourse.$updatedAt)}</p></div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={closeViewModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const XCircle = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

export default AdminCoursesPage;