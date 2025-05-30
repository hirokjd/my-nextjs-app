import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Edit, Trash2, BookOpen, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { databases, ID, account, Query } from "../../utils/appwrite";
import Modal from "../../components/Modal";

const COURSES_PER_PAGE = 20;

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState([]); // Stores all courses, sorted by API then status
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userNames, setUserNames] = useState({});

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);

  // New states for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const COURSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COURSE_COLLECTION_ID;
  const PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID;

  const initialFormData = {
    course_name: "",
    course_description: "",
    credit: "",
    status: "active", // Default status
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
      // Fetch courses sorted by creation date (descending) from Appwrite
      const response = await databases.listDocuments(
        DATABASE_ID, 
        COURSES_COLLECTION_ID,
        [Query.orderDesc("$createdAt")] // Sort by recently added first
      );
      let coursesData = response.documents;

      // Client-side sorting to push 'inactive' courses to the bottom
      const activeCourses = coursesData.filter(course => course.status !== 'inactive'); // Includes 'active' and undefined/null status
      const inactiveCourses = coursesData.filter(course => course.status === 'inactive');
      // Both activeCourses and inactiveCourses retain their $createdAt sort order among themselves
      const sortedCoursesData = [...activeCourses, ...inactiveCourses];
      
      setCourses(sortedCoursesData);

      // Fetch user names (existing logic)
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
    if (!status) { setError("Status is required."); return false;} // Validate status
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
        status: course.status || "active", // Populate status
      });
    } else {
      setEditingCourse(null);
      setFormData(initialFormData); // initialFormData now includes default status
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
      status: currentFormData.status, // Save status
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
    setIsLoading(true); setError(null);
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
  
  const courseModalFields = [
    { name: "course_name", label: "Course Name*", type: "text", required: true, placeholder: "e.g., Introduction to Programming", maxLength: 255 },
    { name: "course_description", label: "Description", type: "textarea", placeholder: "Enter a brief description of the course (max 1000 chars)", rows: 4, maxLength: 1000 },
    { name: "credit", label: "Credits", type: "number", placeholder: "e.g., 3 (0-20)", min:0, max: 20 },
    { name: "status", label: "Status*", type: "select", options: ["active", "inactive"], required: true }, // Added status field
  ];

  // Search and Pagination Logic
  const searchedCourses = useMemo(() => {
    if (!searchTerm) {
      return courses;
    }
    return courses.filter(course =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const totalPages = Math.ceil(searchedCourses.length / COURSES_PER_PAGE);
  const indexOfLastCourse = currentPage * COURSES_PER_PAGE;
  const indexOfFirstCourse = indexOfLastCourse - COURSES_PER_PAGE;
  
  const displayedCourses = useMemo(() => {
      return searchedCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  }, [searchedCourses, indexOfFirstCourse, indexOfLastCourse]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Manage Courses</h1>
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by course name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500" // Changed sm:w-64 to sm:w-80
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <button
          onClick={() => {
            if (!currentUser) { setError("User data is still loading. Please wait a moment before adding a course."); return; }
            openModal();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          disabled={!currentUser || isLoading} 
        >
          <Plus size={18} /> Add Course
        </button>
      </div>

      {error && !isModalOpen && !isViewModalOpen && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
          <p>{error}</p>
        </div>
      )}

      {isLoading && !displayedCourses.length && !error ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading courses...</span>
        </div>
      ) : !displayedCourses.length && !error ? (
         <div className="text-center py-10">
           <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
           <p className="text-gray-500 text-lg">{searchTerm ? "No courses match your search." : "No courses found."}</p>
           {!searchTerm && <p className="text-gray-400">Get started by adding a new course.</p>}
         </div>
      ) : displayedCourses.length > 0 && !error ? (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.course_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                      {course.course_description || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credit === null || course.credit === undefined ? "N/A" : course.credit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {course.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userNames[course.created_by] || course.created_by || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                         <button onClick={() => openViewModal(course)} className="text-gray-600 hover:text-gray-900 transition-colors flex items-center" title="View Course Details"><Eye size={18} /></button>
                         <button onClick={() => openModal(course)} className="text-indigo-600 hover:text-indigo-900 transition-colors flex items-center" title="Edit Course"><Edit size={18} /></button>
                         <button onClick={() => handleDeleteCourse(course.$id)} className="text-red-600 hover:text-red-900 transition-colors flex items-center" title="Delete Course"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
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
                  className={`px-4 py-2 rounded-md text-sm ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
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
      ) : null }

      {isModalOpen && (
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
              <div><label className="block text-sm font-medium text-gray-700">Created At:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{new Date(viewingCourse.$createdAt).toLocaleString()}</p></div>
              <div><label className="block text-sm font-medium text-gray-700">Last Updated:</label><p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{new Date(viewingCourse.$updatedAt).toLocaleString()}</p></div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={closeViewModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const XCircle = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

export default AdminCoursesPage;
