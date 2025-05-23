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
  const [mappedQuestions, setMappedQuestions] = useState([]);
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

  // Fetch exams
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

  // Fetch questions
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
        throw new Error(`Failed to fetch questions: ${err.message}`);
      }

      if (response.total === 0) {
        console.warn('No questions found in the collection');
        setError('No questions found in the collection. Please add questions to the database.');
      }

      const sortedQuestions = response.documents.sort((a, b) => 
        new Date(b.$createdAt) - new Date(a.$createdAt)
      );

      console.log('Fetched questions:', sortedQuestions.length, sortedQuestions);

      setQuestions(sortedQuestions);
      setFilteredQuestions(sortedQuestions);
      
      // Extract unique tags
      const tags = new Set();
      sortedQuestions.forEach(question => {
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
      setError(err.message || "Failed to load questions. Please check your database connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, questionsCollectionId]);

  // Fetch exam questions
  const fetchExamQuestions = useCallback(async (examId) => {
    setIsLoading(true);
    setError(null);
    try {
      const examQuestionsResponse = await databases.listDocuments(
        databaseId, 
        examQuestionsCollectionId,
        [Query.orderAsc('order')]
      );
      
      const filteredExamQuestions = examQuestionsResponse.documents.filter(doc => {
        const examRef = doc.exam_id;
        if (Array.isArray(examRef)) {
          return examRef.some(ref => ref.$id === examId || ref === examId);
        } else if (typeof examRef === 'object') {
          return examRef.$id === examId;
        }
        return examRef === examId;
      });

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
        const questionsResponse = await databases.listDocuments(
          databaseId,
          questionsCollectionId,
          [Query.limit(100)]
        );
        
        const filteredQuestions = questionsResponse.documents.filter(q => 
          questionIds.includes(q.$id) || questionIds.includes(q.question_id)
        );

        const orderedQuestions = filteredExamQuestions.map(eq => {
          const questionRef = eq.question_id;
          const questionId = Array.isArray(questionRef) ? questionRef[0]?.$id || questionRef[0] : 
                           (typeof questionRef === 'object' ? questionRef.$id : questionRef);
          const question = filteredQuestions.find(q => q.$id === questionId || q.question_id === questionId);
          return {
            ...question,
            order: eq.order,
            marks: eq.marks,
            examQuestionId: eq.$id
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

  // Filter questions
  useEffect(() => {
    let results = [...questions];
    
    console.log('Applying filters:', { searchTerm, difficultyFilter, tagFilter, totalQuestions: questions.length });

    if (searchTerm) {
      results = results.filter(question => 
        (question.text?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        question.question_id?.toLowerCase()?.includes(searchTerm.toLowerCase()))
      );
    }
    
    if (difficultyFilter !== "all") {
      results = results.filter(question => 
        question.difficulty === difficultyFilter
      );
    }
    
    if (tagFilter !== "all") {
      results = results.filter(question => 
        question.tags && Array.isArray(question.tags) && question.tags.includes(tagFilter)
      );
    }
    
    console.log('Filtered questions:', results.length, results);

    setFilteredQuestions(results);
    setCurrentPage(1);
  }, [searchTerm, difficultyFilter, tagFilter, questions]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchExams(), fetchQuestions()]);
      } catch (err) {
        setError("Failed to load initial data. Please try again.");
      }
    };
    fetchData();
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
      const { questions: mapped, questionIds } = await fetchExamQuestions(exam.$id);
      setMappedQuestions(mapped);
      setSelectedQuestions(questionIds || []);
      
      const marks = {};
      mapped.forEach(q => {
        marks[q.$id] = q.marks || 1;
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
    setMappedQuestions([]);
    setCurrentPage(1);
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
        setQuestionMarks(prev => ({
          ...prev,
          [questionId]: prev[questionId] || 1
        }));
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
    if (!selectedExam) {
      setError("No exam selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify user authentication
      let user;
      try {
        user = await account.get();
        if (!user) throw new Error("User not authenticated");
      } catch (authError) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const existingQuestions = await fetchExamQuestions(selectedExam.$id);
      
      // Delete removed questions
      const questionsToDelete = existingQuestions.examQuestions.filter(
        q => !selectedQuestions.includes(Array.isArray(q.question_id) ? q.question_id[0] : q.question_id)
      );
      
      await Promise.all(
        questionsToDelete.map(async (q) => {
          try {
            await databases.deleteDocument(databaseId, examQuestionsCollectionId, q.$id);
          } catch (deleteError) {
            console.error(`Failed to delete exam question ${q.$id}:`, deleteError);
            throw new Error(`Failed to delete question ${q.$id}: ${deleteError.message}`);
          }
        })
      );

      // Add/update questions
      await Promise.all(
        selectedQuestions.map(async (questionId, index) => {
          // Validate questionId exists in questions collection
          const questionExists = questions.find(q => q.$id === questionId);
          if (!questionExists) {
            throw new Error(`Question with ID ${questionId} does not exist`);
          }

          const existing = existingQuestions.examQuestions.find(
            q => {
              const qId = Array.isArray(q.question_id) ? q.question_id[0] : q.question_id;
              return qId === questionId;
            }
          );
          
          const marks = questionMarks[questionId] || 1;
          if (isNaN(marks) || marks < 1) {
            throw new Error(`Invalid marks for question ${questionId}`);
          }

          const documentData = {
            exam_id: [selectedExam.$id], // Wrap in array for relationship attribute
            question_id: [questionId],   // Wrap in array for relationship attribute
            order: index + 1,
            marks: marks
          };

          console.log('Creating/Updating exam question:', {
            questionId,
            documentData,
            existing: !!existing
          });

          if (existing) {
            try {
              await databases.updateDocument(
                databaseId,
                examQuestionsCollectionId,
                existing.$id,
                { 
                  order: index + 1, 
                  marks: marks 
                }
              );
            } catch (updateError) {
              console.error(`Failed to update exam question ${existing.$id}:`, updateError);
              throw new Error(`Failed to update question ${questionId}: ${updateError.message}`);
            }
          } else {
            try {
              await databases.createDocument(
                databaseId,
                examQuestionsCollectionId,
                ID.unique(),
                documentData,
                [
                  Permission.read(Role.any()),
                  Permission.update(Role.user(user.$id)),
                  Permission.delete(Role.user(user.$id)),
                  Permission.write(Role.user(user.$id))
                ]
              );
            } catch (createError) {
              console.error(`Failed to create exam question for ${questionId}:`, createError);
              throw new Error(`Failed to create question ${questionId}: ${createError.message}`);
            }
          }
        })
      );

      closeQuestionModal();
      await fetchExams();
    } catch (err) {
      console.error("Error saving exam questions:", {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError(err.message || "Failed to save exam questions. Please check your permissions and try again.");
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-high-contrast">Loading exams data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header and Add Exam button */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <FiBook className="text-primary" />
          Manage Exams
        </h1>
        <div className="dashboard-actions">
          <button
            onClick={refreshData}
            className="btn-action btn-outline-action"
            disabled={isLoading}
          >
            <FiRefreshCw className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openModal()}
            className="btn-action btn-primary-action"
            disabled={isLoading}
          >
            <FiPlus className="mr-1" />
            Add Exam
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-danger/10 border-l-4 border-danger text-danger p-4 mb-6 rounded">
          <p>{error}</p>
          <button 
            onClick={refreshData}
            className="mt-2 text-sm text-danger hover:underline"
            disabled={isLoading}
          >
            Try again
          </button>
        </div>
      )}

      {/* Exams List */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <FiCalendar className="text-primary" />
            All Exams
          </h2>
          <span className="dashboard-card-subtitle">
            {exams.length} exam{exams.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="dashboard-card-content">
          {exams.length > 0 ? (
            exams.map((exam) => (
              <div 
                key={exam.$id}
                onClick={() => viewExamDetails(exam)}
                className="dashboard-list-item"
              >
                <div className="dashboard-list-item-header">
                  <div>
                    <h3 className="dashboard-list-item-title">{exam.name}</h3>
                    <p className="dashboard-list-item-subtitle">{exam.exam_id}</p>
                    <div className="dashboard-list-item-content">
                      <span className="flex items-center text-sm text-muted">
                        <FiCalendar className="mr-1" /> {formatDate(exam.exam_date)}
                      </span>
                      <span className="flex items-center text-sm text-muted">
                        <FiClock className="mr-1" /> {formatDuration(exam.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${
                      exam.status === "active" 
                        ? "status-badge-active" 
                        : exam.status === "completed" 
                          ? "status-badge-upcoming" 
                          : "status-badge-inactive"
                    }`}>
                      {exam.status}
                    </span>
                    <span className={`status-badge ${
                      getExamStatus(exam.exam_date) === "Expired" 
                        ? "status-badge-expired" 
                        : "status-badge-upcoming"
                    }`}>
                      {getExamStatus(exam.exam_date)}
                    </span>
                  </div>
                </div>
                <div className="dashboard-list-item-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openQuestionModal(exam);
                    }}
                    className="btn-action btn-primary-action"
                    disabled={isLoading}
                  >
                    <FiEdit className="mr-1" /> Manage Questions
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openViewQuestionsModal(exam);
                    }}
                    className="btn-action btn-secondary-action"
                    disabled={isLoading}
                  >
                    <FiEye className="mr-1" /> View Questions
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted mb-4">No exams found</p>
              <button
                onClick={() => openModal()}
                className="btn btn-primary"
              >
                Create First Exam
              </button>
            </div>
          )}
        </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold card-heading">
                    Manage Questions for {selectedExam.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {selectedQuestions?.length || 0} question(s) selected
                  </p>
                </div>
                <button
                  onClick={closeQuestionModal}
                  className="text-muted hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-danger/10 border-l-4 border-danger text-danger rounded">
                  <p>{error}</p>
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                  <div>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      <option value="all">All Tags</option>
                      {availableTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Selected questions */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-card-foreground mb-2">Selected Questions</h4>
                {selectedQuestions.length > 0 ? (
                  <div className="bg-muted-light/10 rounded-lg p-4 space-y-4 border border-border">
                    {selectedQuestions.map((questionId, idx) => {
                      const question = questions.find(q => q.$id === questionId);
                      return question ? (
                        <div key={questionId} className="flex justify-between items-center p-3 bg-card rounded-md border border-border">
                          <div className="flex-1 truncate">
                            <p className="font-medium text-card-foreground">{idx + 1}. {question.text}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full mr-2">
                                {question.difficulty}
                              </span>
                              {question.tags && question.tags.map(tag => (
                                <span key={tag} className="text-xs px-2 py-1 bg-muted-light/20 text-muted rounded-full mr-2">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center ml-2">
                            <input
                              type="number"
                              min="1"
                              value={questionMarks[questionId] || '1'}
                              onChange={(e) => handleMarksChange(questionId, parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1 border border-border bg-card text-foreground rounded"
                            />
                            <span className="ml-1 text-sm text-muted">marks</span>
                            <button
                              onClick={() => handleQuestionSelect(questionId)}
                              className="ml-3 text-danger hover:text-danger-600"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <div className="bg-muted-light/10 border border-border rounded-lg p-4 text-center text-muted">
                    No questions selected yet
                  </div>
                )}
              </div>

              {/* Available questions */}
              <div>
                <h4 className="text-lg font-medium text-card-foreground mb-2">Available Questions</h4>
                <div className="bg-muted-light/10 rounded-lg p-4 max-h-96 overflow-y-auto border border-border">
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question) => (
                      <div
                        key={question.$id}
                        className={`mb-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedQuestions.includes(question.$id) 
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-card border-border hover:bg-muted-light/20"
                        }`}
                        onClick={() => handleQuestionSelect(question.$id)}
                      >
                        <div className="flex justify-between">
                          <p className="font-medium text-card-foreground">{question.text}</p>
                          <div className="flex items-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              question.difficulty === "easy" 
                                ? "bg-success/10 text-success" 
                                : question.difficulty === "medium" 
                                  ? "bg-accent/10 text-accent" 
                                  : "bg-danger/10 text-danger"
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          {question.tags && question.tags.map(tag => (
                            <span key={tag} className="inline-block mr-2 mb-1 text-xs px-2 py-1 bg-muted-light/20 text-muted rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-muted">
                      {isLoading ? "Loading questions..." : "No questions match your filters"}
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeQuestionModal}
                  className="px-4 py-2 bg-muted-light/40 text-foreground rounded-md hover:bg-muted-light transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestions}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Questions"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Questions Modal */}
      {isViewQuestionsModalOpen && selectedExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold card-heading">
                    Questions for {selectedExam.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {questions.length} question(s)
                  </p>
                </div>
                <button
                  onClick={closeViewQuestionsModal}
                  className="text-muted hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-danger/10 border-l-4 border-danger text-danger rounded">
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