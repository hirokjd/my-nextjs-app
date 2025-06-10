import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Download, Search, X, BookOpen, Calendar, Clock, Edit, Trash2, Eye } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const questionsPerPage = 10;

  const exportButtonRef = useRef(null);

  const initialFormData = {
    exam_id: "",
    name: "",
    description: "",
    exam_date: "",
    duration: "",
    status: "active",
  };

  const [formData, setFormData] = useState(initialFormData);

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
      setFilteredExams(sortedExams.filter(exam => 
        filterStatus === "" || exam.status === filterStatus
      ));
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
  }, [databaseId, examsCollectionId, filterStatus]);

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

  const validateForm = (data) => {
    if (!data.exam_id.trim()) return "Exam ID is required";
    if (!data.name.trim()) return "Exam name is required";
    if (!data.exam_date) return "Exam date is required";
    if (!data.duration || isNaN(parseInt(data.duration))) return "Duration must be a valid number";
    return null;
  };

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

  const handleSaveQuestions = async () => {
    if (!selectedExam) {
      setError("No exam selected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let user;
      try {
        user = await account.get();
        if (!user) throw new Error("User not authenticated");
      } catch (authError) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const existingQuestions = await fetchExamQuestions(selectedExam.$id);
      
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

      await Promise.all(
        selectedQuestions.map(async (questionId, index) => {
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
            exam_id: [selectedExam.$id],
            question_id: [questionId],
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

  const deleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

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

  const handleExport = async (format) => {
    setIsExportMenuOpen(false);
    if (filteredExams.length === 0) {
      setError("No exams available to export.");
      return;
    }
    try {
      const exportData = filteredExams.map((exam) => ({
        "Exam ID": exam.exam_id,
        "Name": exam.name,
        "Description": exam.description || "N/A",
        "Exam Date": formatDate(exam.exam_date),
        "Duration": formatDuration(exam.duration),
        "Status": exam.status,
        "Created By": exam.created_by || "N/A",
        "Created At": formatDate(exam.created_at),
        "Last Modified": formatDate(exam.modified_at),
      }));
      if (format === "csv") {
        const { Parser } = await import("json2csv");
        const fields = ["Exam ID", "Name", "Description", "Exam Date", "Duration", "Status", "Created By", "Created At", "Last Modified"];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `exams_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "xls") {
        const { utils, writeFile } = await import("xlsx");
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Exams");
        writeFile(wb, `exams_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      setError(`Failed to export to ${format.toUpperCase()}: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h ${mins}m` : 
           `${mins}m`;
  };

  const getExamStatus = (examDate) => {
    const now = new Date();
    const examDateObj = new Date(examDate);
    return examDateObj < now ? "Expired" : "";
  };

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;

  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const viewExamDetails = (exam) => {
    setSelectedExamDetail(exam);
  };

  const closeExamDetails = () => {
    setSelectedExamDetail(null);
  };

  if (isLoading && !exams.length) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
        <div className="container mx-auto">
          <div className="flex justify-center items-center h-32">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
      <div className="container mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-600 sm:text-gray-800">Manage Exams</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold sm:text-sm shadow-sm"
              disabled={isLoading}
            >
              <Plus size={18} /> Add Exam
            </button>
            <div className="relative" ref={exportButtonRef}>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold sm:text-sm shadow-sm"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                <Download size={18} />
                <span>Export</span>
              </button>
              {isExportMenuOpen && (
                <div className="absolute right-0 bg-white rounded-md shadow-lg mt-2 w-48 border border-gray-200 z-50">
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
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
            className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 text-gray-800"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
          {filterStatus && (
            <button
              onClick={() => setFilterStatus("")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-1 sm:text-sm shadow-sm"
            >
              <X size={16} />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-semibold text-gray-800 flex items-center sm:text-lg">
              <BookOpen size={20} className="mr-2 text-blue-600" />
              All Exams
            </h4>
            <span className="text-sm text-gray-500 sm:text-xs">
              {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredExams.length > 0 ? (
            <div className="space-y-4">
              {filteredExams.map((examData) => (
                <div 
                  key={examData.$id}
                  onClick={() => viewExamDetails(examData)}
                  className={`border rounded-lg border-gray-100 p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                    getExamStatus(examData.exam_date) === "" 
                      ? "bg-white" 
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 sm:text-lg">{examData.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{examData.exam_id}</p>
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                        <span className="flex items-center text-sm text-gray-500 sm:text-xs">
                          <Calendar size={16} className="mr-1" /> {formatDate(examData.exam_date)}
                        </span>
                        <span className="flex items-center text-sm text-gray-500 sm:text-xs sm:mt-0 mt-1">
                          <Clock size={16} className="mr-1" /> {formatDuration(examData.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                      <span className={`px-2 py-0 rounded-sm text-sm font-semibold sm:text-xs ${
                        examData.status === "active" 
                          ? "bg-blue-100 text-blue-800" 
                          : examData.status === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {examData.status}
                      </span>
                      <span className={`px-2 py-0 rounded-sm text-sm font-semibold sm:text-xs ${
                        getExamStatus(examData.exam_date) === "Expired" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {getExamStatus(examData.exam_date)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2 gap-1 sm:gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuestionModal(examData);
                      }}
                      className="bg-gray-500 text-white p-1.5 rounded-md hover:bg-gray-600 transition-colors duration-200 sm:p-2"
                      disabled={isLoading}
                      title="Manage Questions"
                    >
                      <Edit size={16} className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewQuestionsModal(examData);
                      }}
                      className="bg-green-500 text-white p-1.5 rounded-md hover:bg-green-600 transition-colors duration-200 sm:p-2"
                      disabled={isLoading}
                      title="View Questions"
                    >
                      <Eye size={16} className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4 text-base sm:text-lg">{filterStatus ? "No exams match the selected status." : "No exams found."}</p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Create First Exam
              </button>
            </div>
          )}
        </div>

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

        {isQuestionModalOpen && selectedExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
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
                    <X size={24} />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <p>{error}</p>
                  </div>
                )}

                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-1">
                      Search Questions
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by text or ID..."
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 pl-10 text-gray-800"
                      disabled={isLoading}
                    />
                    <Search size={20} className="absolute left-3 top-9 -translate-y-1/2 text-gray-400" />
                  </div>
                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-semibold text-gray-700 mb-1">
                      Filter Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 text-gray-800"
                      disabled={isLoading}
                    >
                      <option value="all">All Difficulties</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-1">
                      Filter Tag
                    </label>
                    <select
                      id="tags"
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50 text-gray-800"
                      disabled={isLoading}
                    >
                      <option value="all">All Tags</option>
                      {availableTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  {mappedQuestions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 sm:text-base mb-3">Mapped Questions</h4>
                      <div className="space-y-3">
                        {mappedQuestions.map((question, index) => (
                          <div 
                            key={question.$id} 
                            className={`p-4 border rounded-lg transition-colors ${
                              selectedQuestions.includes(question.$id) 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-8 text-center text-gray-600 sm:text-sm">{index + 1}.</div>
                              <input
                                type="checkbox"
                                checked={selectedQuestions.includes(question.$id)}
                                onChange={() => handleQuestionSelect(question.$id)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded sm:h-4 sm:w-4"
                                disabled={isLoading}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-gray-800 sm:text-sm">
                                    {question.text || "Question"}
                                  </h4>
                                  <span className={`px-2 py-1 text-sm rounded-full sm:text-xs ${
                                    question.difficulty === "easy" 
                                      ? "bg-green-100 text-green-800" 
                                      : question.difficulty === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {question.difficulty}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-gray-600 sm:text-xs">
                                  <span className="mr-2">ID: {question.question_id}</span>
                                  <span>Type: {question.type}</span>
                                  {question.tags && question.tags.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {question.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-xs">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {selectedQuestions.includes(question.$id) && (
                                  <div className="mt-3 flex items-center">
                                    <label htmlFor={`marks-${question.$id}`} className="mr-2 text-sm text-gray-700 sm:text-sm">
                                      Marks:
                                    </label>
                                    <input
                                      type="number"
                                      id={`marks-${question.$id}`}
                                      min="1"
                                      value={questionMarks[question.$id] || 1}
                                      onChange={(e) => handleMarksChange(question.$id, e.target.value)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm sm:text-sm"
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
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 sm:text-base mb-3">All Questions</h4>
                    <div className="space-y-3">
                      {currentQuestions.length > 0 ? (
                        currentQuestions.map((question, index) => (
                          <div 
                            key={question.$id} 
                            className={`p-4 border rounded-lg transition-colors ${
                              selectedQuestions.includes(question.$id) 
                                ? "bg-blue-50 border-blue-200" 
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-8 text-center text-gray-600 sm:text-sm">
                                {(mappedQuestions.length + index + 1) + ((currentPage - 1) * questionsPerPage)}.
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedQuestions.includes(question.$id)}
                                onChange={() => handleQuestionSelect(question.$id)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded sm:h-4 sm:w-4"
                                disabled={isLoading}
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium text-gray-800 sm:text-sm">
                                    {question.text || "Question"}
                                  </h4>
                                  <span className={`px-2 py-1 text-sm rounded-full sm:text-xs ${
                                    question.difficulty === "easy" 
                                      ? "bg-green-100 text-green-800" 
                                      : question.difficulty === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {question.difficulty || "N/A"}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-gray-600 sm:text-xs">
                                  <span className="mr-2">ID: {question.question_id || "N/A"}</span>
                                  <span>Type: {question.type || "N/A"}</span>
                                  {question.tags && question.tags.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {question.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-xs">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {selectedQuestions.includes(question.$id) && (
                                  <div className="mt-3 flex items-center">
                                    <label htmlFor={`marks-${question.$id}`} className="mr-2 text-sm text-gray-700 sm:text-sm">
                                      Marks:
                                    </label>
                                    <input
                                      type="number"
                                      id={`marks-${question.$id}`}
                                      min="1"
                                      value={questionMarks[question.$id] || 1}
                                      onChange={(e) => handleMarksChange(question.$id, e.target.value)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm sm:text-sm"
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
                          {filteredQuestions.length === 0 && questions.length > 0
                            ? "No questions match the current filters"
                            : "No questions found in the collection"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {filteredQuestions.length > questionsPerPage && (
                  <div className="mt-6 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || isLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 sm:text-sm"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 sm:text-xs">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || isLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 sm:text-sm"
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={closeQuestionModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-150 disabled:opacity-50 sm:text-sm"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 sm:text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Questions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isViewQuestionsModalOpen && selectedExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 sm:text-lg">
                      Questions for {selectedExam.name}
                    </h3>
                    <p className="text-sm text-gray-600 sm:text-sm">
                      {questions.length} question(s)
                    </p>
                  </div>
                  <button
                    onClick={closeViewQuestionsModal}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    <X size={24} />
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
                            <h4 className="font-medium text-gray-800 sm:text-sm">
                              Question {question.order || 'N/A'} (Marks: {question.marks || 'N/A'})
                            </h4>
                            <p className="text-sm text-gray-700 mt-1 sm:text-sm">{question.text}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-sm sm:text-xs ${
                              question.difficulty === "easy" 
                                ? "bg-green-100 text-green-800" 
                                : question.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {question.difficulty || "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 sm:text-xs">
                          <span className="mr-2">ID: {question.question_id || "N/A"}</span>
                          <span>Type: {question.type || "N/A"}</span>
                          {question.tags && question.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {question.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs sm:text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {question.options_text && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 sm:text-sm"
                    disabled={isLoading}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedExamDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 sm:text-lg">{selectedExamDetail.name}</h3>
                    <p className="text-sm text-gray-600 sm:text-xs">{selectedExamDetail.exam_id}</p>
                  </div>
                  <div className="flex items-center space-x-3 gap-2 sm:gap-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold sm:text-xs ${
                      selectedExamDetail.status === "active" 
                        ? "bg-blue-100 text-blue-800" 
                        : selectedExamDetail.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {selectedExamDetail.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold sm:text-xs ${
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
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Exam Date:</label>
                    <p className="mt-1 text-sm text-gray-800 sm:mt-0.5">{formatDate(selectedExamDetail.exam_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Duration:</label>
                    <p className="mt-1 text-sm text-gray-800 sm:mt-0.5">{formatDuration(selectedExamDetail.duration)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">Description:</label>
                    <p className="mt-1 text-sm text-gray-800 sm:mt-0.5 whitespace-pre-line">
                      {selectedExamDetail.description || "No description provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Created By:</label>
                    <p className="mt-1 text-sm text-gray-800 sm:mt-0.5">{selectedExamDetail.created_by || "Unknown"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Last Modified:</label>
                    <p className="mt-1 text-sm text-gray-800 sm:mt-0.5">{formatDate(selectedExamDetail.modified_at)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700">Document ID:</label>
                    <p className="mt-1 text-sm text-gray-800 sm:mt-0.5 text-xs sm:text-sm break-all">{selectedExamDetail.$id}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2 sm:space-x-2">
                  <button
                    onClick={() => openModal(selectedExamDetail)}
                    className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors duration-200 sm:p-1.5"
                    disabled={isLoading}
                    title="Edit Exam"
                  >
                    <Edit size={16} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteExam(selectedExamDetail.$id)}
                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors duration-200 sm:p-1.5"
                    disabled={isLoading}
                    title="Delete Exam"
                  >
                    <Trash2 size={16} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openViewQuestionsModal(selectedExamDetail)}
                    className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors duration-200 sm:p-1.5"
                    disabled={isLoading}
                    title="View Questions"
                  >
                    <Eye size={16} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={closeExamDetails}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 sm:text-sm sm:px-2 sm:p-1.5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamsPage;