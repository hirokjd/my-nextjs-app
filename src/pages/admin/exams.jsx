import React, { useState, useEffect, useCallback } from 'react';
import { FiBook, FiCalendar, FiClock, FiPlus, FiRefreshCw, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { databases, ID, Query, Permission, Role } from '../../utils/appwrite';
import { account } from '../../utils/appwrite';
import Modal from '../../components/Modal';

const ExamsPage = () => {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isViewQuestionsModalOpen, setIsViewQuestionsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [questionMarks, setQuestionMarks] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [availableTags, setAvailableTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  const initialFormData = {
    exam_id: "",
    name: "",
    description: "",
    exam_date: "",
    duration: "",
    status: "active",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Environment variables
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const questionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
  const examQuestionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;

  const logQuery = (queryName, params, result, error = null) => {
    console.groupCollapsed(`Query: ${queryName}`);
    console.log('Params:', params);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Result:', result);
    }
    console.groupEnd();
  };

  // Fetch exams with query logging
  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = {
        databaseId,
        collectionId: examsCollectionId,
        queries: [Query.orderDesc("$createdAt")]
      };

      let response;
      try {
        response = await databases.listDocuments(
          queryParams.databaseId,
          queryParams.collectionId,
          queryParams.queries
        );
        logQuery('Fetch Exams', queryParams, {
          total: response.total,
          documents: response.documents
        });
      } catch (err) {
        logQuery('Fetch Exams', queryParams, null, err);
        throw err;
      }

      const examsWithDates = response.documents.map(exam => ({
        ...exam,
        exam_date_obj: new Date(exam.exam_date)
      }));
      
      const sortedExams = examsWithDates.sort((a, b) => {
        const now = new Date();
        const aIsExpired = a.exam_date_obj < now;
        const bIsExpired = b.exam_date_obj < now;
        
        if (aIsExpired && !bIsExpired) return 1;
        if (!aIsExpired && bIsExpired) return -1;
        return a.exam_date_obj - b.exam_date_obj;
      });

      setExams(sortedExams);
      setFilteredExams(sortedExams);
    } catch (err) {
      console.error('Error fetching exams:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError("Failed to load exams. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, examsCollectionId]);

  // Fetch questions with query logging
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = {
        databaseId,
        collectionId: questionsCollectionId,
        queries: [Query.orderDesc("$createdAt"), Query.limit(500)]
      };

      let response;
      try {
        response = await databases.listDocuments(
          queryParams.databaseId,
          queryParams.collectionId,
          queryParams.queries
        );
        logQuery('Fetch Questions', queryParams, {
          total: response.total,
          documents: response.documents
        });
      } catch (err) {
        logQuery('Fetch Questions', queryParams, null, err);
        throw err;
      }

      setQuestions(response.documents);
      setFilteredQuestions(response.documents);
      
      // Extract unique tags
      const tags = new Set();
      response.documents.forEach(question => {
        if (question.tags && Array.isArray(question.tags)) {
          question.tags.forEach(tag => tags.add(tag));
        }
      });
      setAvailableTags(Array.from(tags).sort());
    } catch (err) {
      console.error('Error fetching questions:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError("Failed to load questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, questionsCollectionId]);

  // Fetch exam questions with query logging
  const fetchExamQuestions = useCallback(async (examId) => {
    setIsLoading(true);
    setError(null);
    try {
      // First, get all exam_question documents
      const examQuestionsResponse = await databases.listDocuments(
        databaseId, 
        examQuestionsCollectionId,
        [Query.orderAsc('order')]
      );
      
      // Filter locally for this exam
      const filteredExamQuestions = examQuestionsResponse.documents.filter(doc => {
        // Handle both array and direct reference formats
        const examRef = doc.exam_id;
        if (Array.isArray(examRef)) {
          return examRef.some(ref => ref.$id === examId || ref === examId);
        } else if (typeof examRef === 'object') {
          return examRef.$id === examId;
        }
        return examRef === examId;
      });

      // Get all the questions referenced in these mappings
      const questionIds = filteredExamQuestions.map(eq => {
        const questionRef = eq.question_id;
        if (Array.isArray(questionRef)) {
          return questionRef[0]?.$id || questionRef[0];
        } else if (typeof questionRef === 'object') {
          return questionRef.$id;
        }
        return questionRef;
      }).filter(id => id);

      if (questionIds.length > 0) {
        // Fetch all questions at once
        const questionsResponse = await databases.listDocuments(
          databaseId,
          questionsCollectionId,
          [Query.limit(100)]
        );
        
        // Filter questions locally to match our questionIds
        const filteredQuestions = questionsResponse.documents.filter(q => 
          questionIds.includes(q.$id) || questionIds.includes(q.question_id)
        );

        // Create ordered questions with marks and order
        const orderedQuestions = filteredExamQuestions.map(eq => {
          const questionRef = eq.question_id;
          const questionId = Array.isArray(questionRef) ? questionRef[0]?.$id || questionRef[0] : 
                           (typeof questionRef === 'object' ? questionRef.$id : questionRef);
          const question = filteredQuestions.find(q => q.$id === questionId || q.question_id === questionId);
          return {
            ...question,
            order: eq.order,
            marks: eq.marks
          };
        });

        return {
          questions: orderedQuestions,
          examQuestions: filteredExamQuestions,
          questionIds: filteredExamQuestions.map(q => q.question_id)
        };
      }

      return { questions: [], examQuestions: [], questionIds: [] };
    } catch (err) {
      console.error('Error fetching exam questions:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || "Failed to load exam questions");
      return { questions: [], examQuestions: [], questionIds: [] };
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, questionsCollectionId, examQuestionsCollectionId]);

  // Filter questions based on search and filters
  useEffect(() => {
    let results = questions;
    
    if (searchTerm) {
      results = results.filter(question => 
        question.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.question_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (difficultyFilter !== "all") {
      results = results.filter(question => 
        question.difficulty === difficultyFilter
      );
    }
    
    if (tagFilter !== "all") {
      results = results.filter(question => 
        question.tags && question.tags.includes(tagFilter)
      );
    }
    
    setFilteredQuestions(results);
    setCurrentPage(1);
  }, [searchTerm, difficultyFilter, tagFilter, questions]);

  // Initial data fetch
  useEffect(() => {
    fetchExams();
    fetchQuestions();
  }, [fetchExams, fetchQuestions]);

  // Modal handlers
  const openModal = (exam = null) => {
    setSelectedExam(exam);
    setFormData(
      exam ? {
        exam_id: exam.exam_id || "",
        name: exam.name || "",
        description: exam.description || "",
        exam_date: exam.exam_date ? exam.exam_date.substring(0, 16) : "",
        duration: exam.duration?.toString() || "",
        status: exam.status || "active",
      } : initialFormData
    );
    setIsModalOpen(true);
  };

  const openQuestionModal = async (exam) => {
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      const { questionIds } = await fetchExamQuestions(exam.$id);
      setSelectedQuestions(questionIds || []);
      
      // Initialize marks for selected questions
      const marks = {};
      questionIds.forEach(id => {
        marks[id] = 1; // Default mark is 1
      });
      setQuestionMarks(marks);
      
      setIsQuestionModalOpen(true);
    } catch (err) {
      setError("Failed to load exam questions");
    } finally {
      setIsLoading(false);
    }
  };

  const openViewQuestionsModal = async (exam) => {
    setSelectedExam(exam);
    setIsLoading(true);
    try {
      const { questions: examQuestions } = await fetchExamQuestions(exam.$id);
      setQuestions(examQuestions);
      setIsViewQuestionsModalOpen(true);
    } catch (err) {
      setError("Failed to load exam questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal handlers
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
    setFormData(initialFormData);
    setError(null);
  };

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setSelectedExam(null);
    setSelectedQuestions([]);
    setQuestionMarks({});
    setSearchTerm("");
    setDifficultyFilter("all");
    setTagFilter("all");
  };

  const closeViewQuestionsModal = () => {
    setIsViewQuestionsModalOpen(false);
    setSelectedExam(null);
    setQuestions([]);
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        const newMarks = {...questionMarks};
        delete newMarks[questionId];
        setQuestionMarks(newMarks);
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleMarksChange = (questionId, value) => {
    const marksValue = parseInt(value) || 1;
    setQuestionMarks(prev => ({
      ...prev,
      [questionId]: marksValue > 0 ? marksValue : 1
    }));
  };

  // Form validation
  const validateForm = (data) => {
    if (!data.exam_id.trim()) return "Exam ID is required";
    if (!data.name.trim()) return "Exam name is required";
    if (!data.exam_date) return "Exam date is required";
    if (!data.duration || isNaN(parseInt(data.duration))) return "Duration must be a valid number";
    return null;
  };

  // Save exam
  const handleSave = async (data) => {
    const validationError = validateForm(data);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await account.get();
      if (!user) throw new Error("Authentication required");

      const durationInt = parseInt(data.duration, 10);
      const timestamp = new Date().toISOString();

      if (selectedExam) {
        await databases.updateDocument(
          databaseId,
          examsCollectionId,
          selectedExam.$id,
          { ...data, duration: durationInt, modified_at: timestamp }
        );
      } else {
        await databases.createDocument(
          databaseId,
          examsCollectionId,
          ID.unique(),
          {
            ...data,
            duration: durationInt,
            created_by: user.$id,
            created_at: timestamp,
            modified_at: timestamp,
          },
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id))
          ]
        );
      }

      closeModal();
      await fetchExams();
    } catch (err) {
      console.error("Error saving exam:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || "Failed to save exam");
    } finally {
      setIsLoading(false);
    }
  };

  // Save exam questions
  const handleSaveQuestions = async () => {
    if (!selectedExam) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = await account.get();
      if (!user) throw new Error("Authentication required");

      const existingQuestions = await fetchExamQuestions(selectedExam.$id);
      
      // Delete removed questions
      const questionsToDelete = existingQuestions.examQuestions.filter(
        q => !selectedQuestions.includes(q.question_id)
      );
      
      await Promise.all(
        questionsToDelete.map(q => 
          databases.deleteDocument(databaseId, examQuestionsCollectionId, q.$id)
        )
      );

      // Add/update questions
      await Promise.all(
        selectedQuestions.map(async (questionId, index) => {
          const existing = existingQuestions.examQuestions.find(
            q => q.question_id === questionId
          );
          
          if (existing) {
            await databases.updateDocument(
              databaseId,
              examQuestionsCollectionId,
              existing.$id,
              { 
                order: index + 1, 
                marks: questionMarks[questionId] || 1 
              }
            );
          } else {
            await databases.createDocument(
              databaseId,
              examQuestionsCollectionId,
              ID.unique(),
              {
                exam_id: selectedExam.$id,
                question_id: questionId,
                order: index + 1,
                marks: questionMarks[questionId] || 1
              },
              [
                Permission.read(Role.any()),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id))
              ]
            );
          }
        })
      );

      closeQuestionModal();
    } catch (err) {
      console.error("Error saving exam questions:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || "Failed to save exam questions");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete exam
  const deleteExam = async (examId) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    setIsLoading(true);
    try {
      const user = await account.get();
      if (!user) throw new Error("Authentication required");

      const examQuestions = await fetchExamQuestions(examId);
      await Promise.all(
        examQuestions.examQuestions.map(q => 
          databases.deleteDocument(databaseId, examQuestionsCollectionId, q.$id)
        )
      );

      await databases.deleteDocument(databaseId, examsCollectionId, examId);
      await fetchExams();
      closeExamDetails();
    } catch (err) {
      console.error("Error deleting exam:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || "Failed to delete exam");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getExamStatus = (examDate) => {
    const now = new Date();
    const examDateObj = new Date(examDate);
    return examDateObj < now ? "Expired" : "Upcoming";
  };

  // Pagination
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  // View components
  const viewExamDetails = (exam) => {
    setSelectedExamDetail(exam);
  };

  const closeExamDetails = () => {
    setSelectedExamDetail(null);
  };

  const refreshData = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await Promise.all([fetchExams(), fetchQuestions()]);
    } catch (err) {
      setError("Failed to refresh data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !exams.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading exams data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header and Add Exam button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiBook className="mr-2 text-blue-600" />
          Manage Exams
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            className="flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md transition-colors"
            disabled={isLoading}
          >
            <FiRefreshCw className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            disabled={isLoading}
          >
            <FiPlus className="mr-1" />
            Add Exam
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
          <button 
            onClick={refreshData}
            className="mt-2 text-sm text-red-700 hover:underline"
            disabled={isLoading}
          >
            Try again
          </button>
        </div>
      )}

      {/* Exams List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiCalendar className="mr-2 text-blue-600" />
            All Exams
          </h2>
          <span className="text-sm text-gray-500">
            {exams.length} exam{exams.length !== 1 ? 's' : ''}
          </span>
        </div>

        {exams.length > 0 ? (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div 
                key={exam.$id}
                onClick={() => viewExamDetails(exam)}
                className={`border border-gray-100 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  getExamStatus(exam.exam_date) === "Expired" 
                    ? "bg-gray-50" 
                    : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{exam.exam_id}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-1" /> {formatDate(exam.exam_date)}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        <FiClock className="mr-1" /> {formatDuration(exam.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      exam.status === "active" 
                        ? "bg-green-100 text-green-800" 
                        : exam.status === "completed" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                    }`}>
                      {exam.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      getExamStatus(exam.exam_date) === "Expired" 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {getExamStatus(exam.exam_date)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openQuestionModal(exam);
                    }}
                    className="flex items-center text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                    disabled={isLoading}
                  >
                    <FiEdit className="mr-1" /> Manage Questions
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openViewQuestionsModal(exam);
                    }}
                    className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    disabled={isLoading}
                  >
                    <FiEye className="mr-1" /> View Questions
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No exams found</p>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create First Exam
            </button>
          </div>
        )}
      </div>

      {/* Exam Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          title={selectedExam ? "Edit Exam" : "Add Exam"}
          onClose={closeModal}
          onSave={handleSave}
          initialData={formData}
          fields={[
            { name: "exam_id", label: "Exam ID", type: "text", required: true, disabled: !!selectedExam },
            { name: "name", label: "Exam Name", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "exam_date", label: "Exam Date", type: "datetime-local", required: true },
            { name: "duration", label: "Duration (minutes)", type: "number", required: true, min: 1 },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: ["active", "inactive", "completed"],
              required: true,
            },
          ]}
          onChange={handleInputChange}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Question Management Modal */}
      {isQuestionModalOpen && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Manage Questions for {selectedExam.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedQuestions?.length || 0} question(s) selected
                  </p>
                </div>
                <button
                  onClick={closeQuestionModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              {/* Filters */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Questions
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by text or ID..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Tag
                  </label>
                  <div className="relative">
                    <select
                      id="tags"
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading}
                    >
                      <option value="all">All Tags</option>
                      {availableTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions list */}
              <div className="space-y-3">
                {currentQuestions.length > 0 ? (
                  currentQuestions.map((question) => (
                    <div 
                      key={question.$id} 
                      className={`p-4 border rounded-lg transition-colors ${
                        selectedQuestions.includes(question.$id) 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.$id)}
                          onChange={() => handleQuestionSelect(question.$id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          disabled={isLoading}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-800">
                              {question.text || "Question"}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              question.difficulty === "easy" 
                                ? "bg-green-100 text-green-800" 
                                : question.difficulty === "medium" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-red-100 text-red-800"
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <span className="mr-2">ID: {question.question_id}</span>
                            <span>Type: {question.type}</span>
                            {question.tags && question.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {question.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {selectedQuestions.includes(question.$id) && (
                            <div className="mt-3 flex items-center">
                              <label htmlFor={`marks-${question.$id}`} className="mr-2 text-sm text-gray-700">
                                Marks:
                              </label>
                              <input
                                type="number"
                                id={`marks-${question.$id}`}
                                min="1"
                                value={questionMarks[question.$id] || 1}
                                onChange={(e) => handleMarksChange(question.$id, e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                disabled={isLoading}
                              />
                            </div>
                          )}
                          
                          {question.options_text && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.options_text.map((option, index) => (
                                <div 
                                  key={index} 
                                  className={`text-sm p-2 rounded ${
                                    question.correct_answer === index 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions found matching your criteria
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredQuestions.length > questionsPerPage && (
                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeQuestionModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isLoading || (selectedQuestions?.length || 0) === 0}
                >
                  {isLoading ? 'Saving...' : 'Save Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Questions Modal */}
      {isViewQuestionsModalOpen && selectedExam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Questions for {selectedExam.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {questions.length} question(s)
                  </p>
                </div>
                <button
                  onClick={closeViewQuestionsModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {questions.length > 0 ? (
                  questions.map((question) => (
                    <div key={question.$id} className="p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Question {question.order || 'N/A'} (Marks: {question.marks || 'N/A'})
                          </h4>
                          <p className="text-gray-700 mt-1">{question.text}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            question.difficulty === "easy" 
                              ? "bg-green-100 text-green-800" 
                              : question.difficulty === "medium" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-red-100 text-red-800"
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="mr-2">ID: {question.question_id}</span>
                        <span>Type: {question.type}</span>
                        {question.tags && question.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {question.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {question.options_text && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {question.options_text.map((option, index) => (
                            <div 
                              key={index} 
                              className={`text-sm p-2 rounded ${
                                question.correct_answer === index 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions found for this exam
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeViewQuestionsModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Details Modal */}
      {selectedExamDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedExamDetail.name}</h3>
                  <p className="text-sm text-gray-600">{selectedExamDetail.exam_id}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedExamDetail.status === "active" 
                      ? "bg-green-100 text-green-800" 
                      : selectedExamDetail.status === "completed" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedExamDetail.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    getExamStatus(selectedExamDetail.exam_date) === "Expired" 
                      ? "bg-red-100 text-red-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {getExamStatus(selectedExamDetail.exam_date)}
                  </span>
                  <button
                    onClick={closeExamDetails}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Exam Date</h4>
                  <p className="mt-1 text-gray-800">{formatDate(selectedExamDetail.exam_date)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                  <p className="mt-1 text-gray-800">{formatDuration(selectedExamDetail.duration)}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="mt-1 text-gray-800 whitespace-pre-line">
                    {selectedExamDetail.description || "No description provided"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Created By</h4>
                  <p className="mt-1 text-gray-800">{selectedExamDetail.created_by || "Unknown"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Last Modified</h4>
                  <p className="mt-1 text-gray-800">{formatDate(selectedExamDetail.modified_at)}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">Document ID</h4>
                  <p className="mt-1 text-gray-800 text-xs break-all">{selectedExamDetail.$id}</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => openModal(selectedExamDetail)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  <FiEdit className="mr-1" /> Edit Exam
                </button>
                <button
                  onClick={() => deleteExam(selectedExamDetail.$id)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  disabled={isLoading}
                >
                  <FiTrash2 className="mr-1" /> Delete Exam
                </button>
                <button
                  onClick={() => openViewQuestionsModal(selectedExamDetail)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  disabled={isLoading}
                >
                  <FiEye className="mr-1" /> View Questions
                </button>
                <button
                  onClick={closeExamDetails}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;