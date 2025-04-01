import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import Modal from "../../components/Modal";
import { databases, ID } from "../../utils/appwrite";
import { account } from "../../utils/appwrite";

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExamDetail, setSelectedExamDetail] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

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

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!databaseId || !examsCollectionId) {
        throw new Error("Missing Database ID or Collection ID");
      }

      const response = await databases.listDocuments(databaseId, examsCollectionId);
      const examsWithDates = response.documents.map(exam => ({
        ...exam,
        exam_date_obj: new Date(exam.exam_date)
      }));
      
      // Sort by date (upcoming first, expired last)
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
      console.error("Error fetching exams:", err);
      setError("Failed to load exams. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [databaseId, examsCollectionId]);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await databases.listDocuments(databaseId, questionsCollectionId);
      setQuestions(response.documents);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions");
    }
  }, [databaseId, questionsCollectionId]);

  const fetchExamQuestions = useCallback(async (examId) => {
    try {
      const response = await databases.listDocuments(databaseId, "exam_questions", [
        `equal("exam_id", "${examId}")`
      ]);
      return response.documents;
    } catch (err) {
      console.error("Error fetching exam questions:", err);
      return [];
    }
  }, [databaseId]);

  useEffect(() => {
    fetchExams();
    fetchQuestions();
  }, [fetchExams, fetchQuestions]);

  const openModal = (exam = null) => {
    setSelectedExam(exam);
    setFormData(
      exam
        ? {
            exam_id: exam.exam_id || "",
            name: exam.name || "",
            description: exam.description || "",
            exam_date: exam.exam_date || "",
            duration: exam.duration?.toString() || "",
            status: exam.status || "active",
          }
        : initialFormData
    );
    setIsModalOpen(true);
  };

  const openQuestionModal = async (exam) => {
    setSelectedExam(exam);
    const examQuestions = await fetchExamQuestions(exam.$id);
    setSelectedQuestions(examQuestions.map(q => q.question_id));
    setIsQuestionModalOpen(true);
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
  };

  const viewExamDetails = (exam) => {
    setSelectedExamDetail(exam);
  };

  const closeExamDetails = () => {
    setSelectedExamDetail(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const validateForm = (data) => {
    if (!data.exam_id.trim()) {
      return "Exam ID is required";
    }
    if (!data.name.trim()) {
      return "Exam name is required";
    }
    if (!data.exam_date) {
      return "Exam date is required";
    }
    if (!data.duration || isNaN(parseInt(data.duration))) {
      return "Duration must be a valid number";
    }
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
      const userId = user?.$id || "unknown";
      const timestamp = new Date().toISOString();
      const durationInt = parseInt(data.duration, 10);

      if (selectedExam) {
        await databases.updateDocument(
          databaseId,
          examsCollectionId,
          selectedExam.$id,
          {
            ...data,
            duration: durationInt,
            modified_at: timestamp,
          }
        );
      } else {
        await databases.createDocument(
          databaseId,
          examsCollectionId,
          ID.unique(),
          {
            exam_id: data.exam_id,
            name: data.name,
            description: data.description,
            exam_date: data.exam_date,
            duration: durationInt,
            status: data.status,
            created_by: userId,
            created_at: timestamp,
            modified_at: timestamp,
          }
        );
      }

      closeModal();
      await fetchExams();
    } catch (err) {
      console.error("Error saving exam:", err);
      setError(err.message || "Failed to save exam");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!selectedExam || selectedQuestions.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      // First delete existing exam questions
      const existingQuestions = await fetchExamQuestions(selectedExam.$id);
      await Promise.all(
        existingQuestions.map(q => 
          databases.deleteDocument(databaseId, "exam_questions", q.$id)
        )
      );

      // Add new selected questions
      await Promise.all(
        selectedQuestions.map(async (questionId, index) => {
          await databases.createDocument(
            databaseId,
            "exam_questions",
            ID.unique(),
            {
              exam_id: selectedExam.$id,
              question_id: questionId,
              order: index + 1,
              marks: 1 // Default marks, can be made configurable
            }
          );
        })
      );

      closeQuestionModal();
    } catch (err) {
      console.error("Error saving exam questions:", err);
      setError("Failed to save exam questions");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExam = async (examId) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;

    setIsLoading(true);
    try {
      // First delete associated exam questions
      const examQuestions = await fetchExamQuestions(examId);
      await Promise.all(
        examQuestions.map(q => 
          databases.deleteDocument(databaseId, "exam_questions", q.$id)
        )
      );

      // Then delete the exam
      await databases.deleteDocument(databaseId, examsCollectionId, examId);
      await fetchExams();
      closeExamDetails();
    } catch (err) {
      console.error("Error deleting exam:", err);
      setError("Failed to delete exam");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getExamStatus = (examDate) => {
    const now = new Date();
    const examDateObj = new Date(examDate);
    return examDateObj < now ? "Expired" : "Upcoming";
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Exams</h2>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            + Add Exam
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}

        {isLoading && !exams.length ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Loading exams...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <div 
                key={exam.$id}
                onClick={() => viewExamDetails(exam)}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  getExamStatus(exam.exam_date) === "Expired" 
                    ? "bg-gray-50 border-gray-200" 
                    : "bg-white border-blue-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-600">{exam.exam_id}</p>
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
                <div className="mt-2 text-sm text-gray-600">
                  <p>{formatDate(exam.exam_date)} • {exam.duration} minutes</p>
                  {exam.description && (
                    <p className="mt-1 line-clamp-2">{exam.description}</p>
                  )}
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openQuestionModal(exam);
                    }}
                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                  >
                    Manage Questions
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            title={selectedExam ? "Edit Exam" : "Add Exam"}
            onClose={closeModal}
            onSave={handleSave}
            initialData={formData}
            fields={[
              { name: "exam_id", label: "Exam ID", type: "text", required: true },
              { name: "name", label: "Exam Name", type: "text", required: true },
              { name: "description", label: "Description", type: "textarea" },
              { name: "exam_date", label: "Exam Date", type: "datetime-local", required: true },
              { name: "duration", label: "Duration (minutes)", type: "number", required: true },
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
                    <p className="text-sm text-gray-600">Select questions to include in this exam</p>
                  </div>
                  <button
                    onClick={closeQuestionModal}
                    className="text-gray-500 hover:text-gray-700"
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
                  {questions.map((question) => (
                    <div 
                      key={question.$id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedQuestions.includes(question.$id) 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleQuestionSelect(question.$id)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.$id)}
                          onChange={() => handleQuestionSelect(question.$id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{question.text || "Question"}</h4>
                          <div className="mt-1 text-sm text-gray-600">
                            <span className="mr-2">ID: {question.question_id}</span>
                            <span>Difficulty: {question.difficulty}</span>
                          </div>
                          {question.options_text && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
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

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={closeQuestionModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isLoading || selectedQuestions.length === 0}
                  >
                    {isLoading ? 'Saving...' : 'Save Questions'}
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
                    <p className="mt-1 text-gray-800">{selectedExamDetail.duration} minutes</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-gray-800 whitespace-pre-line">
                      {selectedExamDetail.description || "No description provided"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    onClick={() => openModal(selectedExamDetail)}
      
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Exam
                  </button>
                  <button
                    onClick={() => deleteExam(selectedExamDetail.$id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Exam
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
    </AdminLayout>
  );
};

export default ExamsPage;