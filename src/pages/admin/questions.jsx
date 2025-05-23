import React, { useState, useEffect, useRef, useCallback } from "react";
import { databases, storage, ID } from "../../utils/appwrite";
import { ClipboardList, FileText } from "lucide-react";

const BUCKET_ID = "questions";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const modalRef = useRef(null);
  const viewModalRef = useRef(null);

  const initialFormData = {
    question_id: "",
    text: "",
    image_id: "",
    options_text: ["", "", "", ""],
    options_image: ["", "", "", ""],
    correct_answer: 0,
    difficulty: "",
    tags: "",
    created_by: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Memoized fetch function
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID
      );

      const updatedQuestions = await Promise.all(
        response.documents.map(async (q) => ({
          ...q,
          imageUrl: q.image_id ? await getFileUrl(q.image_id) : null,
          optionsImageUrls: await Promise.all(
            q.options_image.map(async (imgId) => 
              imgId ? await getFileUrl(imgId) : null
            )
          )
        }))
      );

      setQuestions(updatedQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const getFileUrl = async (fileId) => {
    try {
      return storage.getFileView(BUCKET_ID, fileId);
    } catch (error) {
      console.error("Error fetching image:", error.message);
      return null;
    }
  };

  const handleInputChange = (e, field, index = null) => {
    if (index !== null) {
      setFormData((prev) => ({
        ...prev,
        options_text: prev.options_text.map((opt, i) =>
          i === index ? e.target.value : opt
        )
      }));
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  const handleImageUpload = async (file, field, index = null) => {
    if (!file) return;
    try {
      const uploadResponse = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const fileId = uploadResponse.$id;

      setFormData(prev => ({
        ...prev,
        ...(field === "image_id" 
          ? { image_id: fileId }
          : {
              options_image: prev.options_image.map((img, i) => 
                i === index ? fileId : img
              )
            }
        )
      }));
    } catch (error) {
      console.error("Image upload error:", error.message);
    }
  };

  const validateForm = () => {
    if (!formData.question_id || !formData.created_by) {
      alert("Please provide Question ID and Created By field.");
      return false;
    }
    if (!formData.text && !formData.image_id) {
      alert("Please provide either a question text or an image.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const questionData = {
        question_id: formData.question_id,
        text: formData.text,
        image_id: formData.image_id,
        options_text: formData.options_text,
        options_image: formData.options_image,
        correct_answer: formData.correct_answer,
        difficulty: formData.difficulty,
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
        created_by: formData.created_by,
      };

      if (editingQuestion) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
          editingQuestion.$id,
          questionData
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
          ID.unique(),
          questionData
        );
      }

      closeModal();
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
        id
      );
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error.message);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_id: question.question_id,
      text: question.text || "",
      image_id: question.image_id || "",
      options_text: question.options_text || ["", "", "", ""],
      options_image: question.options_image || ["", "", "", ""],
      correct_answer: question.correct_answer || 0,
      difficulty: question.difficulty || "",
      tags: question.tags ? question.tags.join(", ") : "",
      created_by: question.created_by || "",
    });
    setModalOpen(true);
  };

  const handleView = (question) => {
    setViewingQuestion(question);
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingQuestion(null);
    setFormData(initialFormData);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingQuestion(null);
  };

  // Handle outside click for both modals
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

  // Icon components
  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <ClipboardList className="text-primary" size={24} />
          Manage Questions
        </h1>
        <div className="dashboard-actions">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-action btn-primary-action"
          >
            Add Question
          </button>
        </div>
      </div>

      {/* Questions Table Card */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h2 className="dashboard-card-title">
            <FileText className="text-primary" size={20} />
            Questions Database
          </h2>
        </div>
        
        <div className="dashboard-card-content">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-foreground">Question ID</th>
                  <th className="px-4 py-3 text-sm font-medium text-foreground">Content</th>
                  <th className="px-4 py-3 text-sm font-medium text-foreground">Difficulty</th>
                  <th className="px-4 py-3 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-muted">
                      Loading questions...
                    </td>
                  </tr>
                ) : questions.length > 0 ? (
                  questions.map((question) => (
                    <tr key={question.$id} className="hover:bg-muted/10">
                      <td className="px-4 py-3 text-sm text-foreground">{question.question_id}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {question.text ? (
                          <div className="line-clamp-1">{question.text}</div>
                        ) : (
                          <div className="text-muted italic">Image question</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`status-badge ${
                          question.difficulty === "Easy" 
                            ? "status-badge-active" 
                            : question.difficulty === "Medium" 
                              ? "status-badge-upcoming" 
                              : "status-badge-expired"
                        }`}>
                          {question.difficulty || "Not set"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(question)}
                            className="p-1 text-muted hover:text-foreground"
                            title="View Question"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={() => handleEdit(question)}
                            className="p-1 text-muted hover:text-primary"
                            title="Edit Question"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDelete(question.$id)}
                            className="p-1 text-muted hover:text-danger"
                            title="Delete Question"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-muted">
                      No questions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div
            ref={modalRef}
            className="bg-card p-6 rounded-lg shadow-xl w-[1200px] max-h-[90vh] overflow-y-auto border border-border"
          >
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              {editingQuestion ? "Edit Question" : "Add Question"}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Question ID</label>
                <input
                  className="w-full border border-border rounded px-3 py-2 bg-background text-foreground focus:ring-primary focus:border-primary"
                  value={formData.question_id}
                  onChange={(e) => handleInputChange(e, "question_id")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Created By</label>
                <input
                  className="w-full border border-border rounded px-3 py-2 bg-background text-foreground focus:ring-primary focus:border-primary"
                  value={formData.created_by}
                  onChange={(e) => handleInputChange(e, "created_by")}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">Question Text</label>
              <textarea
                className="w-full border border-border rounded px-3 py-2 h-32 bg-background text-foreground focus:ring-primary focus:border-primary"
                value={formData.text}
                onChange={(e) => handleInputChange(e, "text")}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-1">Question Image</label>
              <input
                type="file"
                className="block w-full text-sm text-foreground bg-background
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary/10 file:text-primary
                  hover:file:bg-primary/20"
                onChange={(e) => handleImageUpload(e.target.files[0], "image_id")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Difficulty</label>
                <input
                  className="w-full border border-border rounded px-3 py-2 bg-background text-foreground focus:ring-primary focus:border-primary"
                  placeholder="easy, medium, hard"
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange(e, "difficulty")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
                <input
                  className="w-full border border-border rounded px-3 py-2 bg-background text-foreground focus:ring-primary focus:border-primary"
                  placeholder="comma separated"
                  value={formData.tags}
                  onChange={(e) => handleInputChange(e, "tags")}
                />
              </div>
            </div>

            <h4 className="text-lg font-medium mb-3 text-foreground">Options:</h4>
            <div className="space-y-4">
              {formData.options_text.map((option, index) => (
                <div key={index} className="flex items-start gap-4 p-3 border border-border rounded-lg bg-background">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Option {index + 1}
                    </label>
                    <textarea
                      className="w-full border border-border rounded px-3 py-2 h-20 bg-background text-foreground focus:ring-primary focus:border-primary"
                      value={option}
                      onChange={(e) => handleInputChange(e, "options_text", index)}
                    />
                    <div className="mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="correct_answer"
                          className="h-4 w-4 text-primary focus:ring-primary border-border bg-background"
                          checked={formData.correct_answer === index}
                          onChange={() =>
                            setFormData({ ...formData, correct_answer: index })
                          }
                        />
                        <span className="ml-2 text-sm text-foreground">Correct Answer</span>
                      </label>
                    </div>
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-foreground mb-1">Option Image</label>
                    <input
                      type="file"
                      className="block w-full text-sm text-foreground bg-background
                        file:mr-2 file:py-1 file:px-2
                        file:rounded file:border-0
                        file:text-xs file:font-semibold
                        file:bg-primary/10 file:text-primary
                        hover:file:bg-primary/20"
                      onChange={(e) =>
                        handleImageUpload(e.target.files[0], "options_image", index)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                onClick={handleSave}
              >
                {editingQuestion ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Question Modal */}
      {viewModalOpen && viewingQuestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border" ref={viewModalRef}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-foreground">View Question</h3>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted mb-2">Question ID</h4>
                  <p className="p-3 bg-muted/20 rounded-md text-foreground">{viewingQuestion.question_id}</p>
                </div>

                {viewingQuestion.text && (
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-2">Question Text</h4>
                    <p className="p-3 bg-muted/20 rounded-md text-foreground">{viewingQuestion.text}</p>
                  </div>
                )}

                {viewingQuestion.imageUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-2">Question Image</h4>
                    <div className="p-3 bg-muted/20 rounded-md">
                      <img 
                        src={viewingQuestion.imageUrl} 
                        alt="Question" 
                        className="max-h-60 object-contain mx-auto border border-border rounded-md"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted mb-2">Options</h4>
                  <div className="space-y-3">
                    {viewingQuestion.options_text.map((option, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-md flex items-start gap-3 ${
                          index === viewingQuestion.correct_answer
                            ? "bg-success/10 border border-success/30"
                            : "bg-muted/20"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium ${
                          index === viewingQuestion.correct_answer
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className="flex-1">
                          <p className={index === viewingQuestion.correct_answer ? "text-success font-medium" : "text-foreground"}>
                            {option || <span className="text-muted italic">No text</span>}
                          </p>
                          
                          {viewingQuestion.optionsImageUrls && viewingQuestion.optionsImageUrls[index] && (
                            <img 
                              src={viewingQuestion.optionsImageUrls[index]} 
                              alt={`Option ${String.fromCharCode(65 + index)}`} 
                              className="mt-2 max-h-32 object-contain border border-border rounded-md"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {viewingQuestion.difficulty && (
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-2">Difficulty</h4>
                    <p className="p-3 bg-muted/20 rounded-md text-foreground">{viewingQuestion.difficulty}</p>
                  </div>
                )}

                {viewingQuestion.tags && viewingQuestion.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted mb-2">Tags</h4>
                    <div className="p-3 bg-muted/20 rounded-md flex flex-wrap gap-2">
                      {viewingQuestion.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted mb-2">Created By</h4>
                  <p className="p-3 bg-muted/20 rounded-md text-foreground">{viewingQuestion.created_by}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleEdit(viewingQuestion);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Edit Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsPage;