import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { databases, storage, ID } from "../../utils/appwrite";
import { Plus, Eye, Edit, Trash2, Search, X, Download } from "lucide-react";

const BUCKET_ID = "questions";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const modalRef = useRef(null);
  const viewModalRef = useRef(null);
  const exportButtonRef = useRef(null);

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

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
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
      setError("Failed to load questions: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
      if (viewModalRef.current && !viewModalRef.current.contains(event.target)) {
        closeViewModal();
      }
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };

    if (modalOpen || viewModalOpen || isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalOpen, viewModalOpen, isExportMenuOpen]);

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
      setFormData({ ...prev, [field]: e.target.value });
    }
    if (error) setError("");
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
      setError("Failed to upload image: " + error.message);
    }
  };

  const validateForm = () => {
    if (!formData.question_id || !formData.created_by) {
      setError("Please provide Question ID and Created By field.");
      return false;
    }
    if (!formData.text && !formData.image_id) {
      setError("Please provide either a question text or an image.");
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
      setError("Error saving question: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
        id
      );
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error.message);
      setError("Failed to delete question: " + error.message);
    }
  };

  const handleExport = async (format) => {
    setIsExportMenuOpen(false);
    if (filteredQuestions.length === 0) {
      setError("No questions available to export.");
      return;
    }
    try {
      const exportData = filteredQuestions.map((q) => ({
        "Question ID": q.question_id,
        Text: q.text || "N/A",
        "Image ID": q.image_id || "N/A",
        "Option 1 Text": q.options_text[0] || "N/A",
        "Option 2 Text": q.options_text[1] || "N/A",
        "Option 3 Text": q.options_text[2] || "N/A",
        "Option 4 Text": q.options_text[3] || "N/A",
        "Option 1 Image": q.options_image[0] || "N/A",
        "Option 2 Image": q.options_image[1] || "N/A",
        "Option 3 Image": q.options_image[2] || "N/A",
        "Option 4 Image": q.options_image[3] || "N/A",
        "Correct Answer": q.correct_answer,
        Difficulty: q.difficulty || "N/A",
        Tags: q.tags?.join(", ") || "N/A",
        "Created By": q.created_by || "N/A",
      }));
      if (format === "csv") {
        const { Parser } = await import("json2csv");
        const fields = [
          "Question ID", "Text", "Image ID", 
          "Option 1 Text", "Option 2 Text", "Option 3 Text", "Option 4 Text",
          "Option 1 Image", "Option 2 Image", "Option 3 Image", "Option 4 Image",
          "Correct Answer", "Difficulty", "Tags", "Created By"
        ];
        const parser = new Parser({ fields });
        const csv = parser.parse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `questions_${new Date().toISOString().slice(0, 10)}.csv`);
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === "xls") {
        const { utils, writeFile } = await import("xlsx");
        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "Questions");
        writeFile(wb, `questions_${new Date().toISOString().slice(0, 10)}.xlsx`);
      }
    } catch (error) {
      console.error(`Error exporting to ${format.toUpperCase()}:`, error);
      setError(`Failed to export to ${format.toUpperCase()}: ${error.message}`);
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
    setError("");
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingQuestion(null);
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(
      (q) =>
        (filterDifficulty === "" || q.difficulty.toLowerCase() === filterDifficulty.toLowerCase()) &&
        (q.question_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
         q.text?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [questions, searchTerm, filterDifficulty]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const ActionButtons = ({ question }) => (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 transition-colors duration-200"
        onClick={() => handleView(question)}
        title="View"
        aria-label="View question"
      >
        <Eye size={16} className="w-4 h-4" />
      </button>
      <button
        className="bg-yellow-500 text-white p-1 rounded-md hover:bg-yellow-600 transition-colors duration-200"
        onClick={() => handleEdit(question)}
        title="Edit"
        aria-label="Edit question"
      >
        <Edit size={16} className="w-4 h-4" />
      </button>
      <button
        className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors duration-200"
        onClick={() => handleDelete(question.$id)}
        title="Delete"
        aria-label="Delete question"
      >
        <Trash2 size={16} className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
      <div className="container mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Exam Enrollments</h2>
          <div className="flex flex-wrap gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={18} />
              <span>Add Question</span>
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
          <label htmlFor="difficulty_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Difficulty:</label>
          <select
            id="difficulty_filter"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {filterDifficulty && (
            <button
              onClick={() => setFilterDifficulty("")}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"
            >
              <X size={16} />
              Clear Filter
            </button>
          )}
          <div className="relative flex-grow sm:ml-4 w-full sm:w-auto">
            <label htmlFor="main_search" className="sr-only">Search Questions</label>
            <input
              type="text"
              id="main_search"
              placeholder="Search by ID or text..."
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
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">{searchTerm || filterDifficulty ? "No questions match your search or filter." : "No questions found."}</p>
            {!searchTerm && !filterDifficulty && <p className="text-gray-400">Get started by adding a new question.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((q) => (
                  <tr key={q.$id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{q.question_id}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate">{q.text || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {q.imageUrl ? (
                        <img src={q.imageUrl} alt="Question" className="h-12 object-contain" />
                      ) : (
                        <span className="text-sm text-gray-400">No Image</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{q.difficulty || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <ActionButtons question={q} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
            <div
              ref={modalRef}
              className="bg-white p-6 rounded-lg shadow-xl w-[1200px] max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-semibold mb-4">
                {editingQuestion ? "Edit Question" : "Add Question"}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question ID</label>
                  <input
                    className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.question_id}
                    onChange={(e) => handleInputChange(e, "question_id")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <input
                    className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.created_by}
                    onChange={(e) => handleInputChange(e, "created_by")}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  className="w-full border rounded px-3 py-2 h-32 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.text}
                  onChange={(e) => handleInputChange(e, "text")}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Image</label>
                <input
                  type="file"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  onChange={(e) => handleImageUpload(e.target.files[0], "image_id")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <input
                    className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="easy, medium, hard"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange(e, "difficulty")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="comma separated"
                    value={formData.tags}
                    onChange={(e) => handleInputChange(e, "tags")}
                  />
                </div>
              </div>

              <h4 className="text-lg font-medium mb-3">Options:</h4>
              <div className="space-y-4">
                {formData.options_text.map((option, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Option {index + 1}
                      </label>
                      <textarea
                        className="w-full border rounded px-3 py-2 h-20 focus:ring-blue-500 focus:border-blue-500"
                        value={option}
                        onChange={(e) => handleInputChange(e, "options_text", index)}
                      />
                      <div className="mt-2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="correct_answer"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            checked={formData.correct_answer === index}
                            onChange={() =>
                              setFormData({ ...formData, correct_answer: index })
                            }
                          />
                          <span className="ml-2 text-sm text-gray-700">Correct Answer</span>
                        </label>
                      </div>
                    </div>
                    <div className="w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Option Image</label>
                      <input
                        type="file"
                        className="block w-full text-sm text-gray-500
                          file:mr-2 file:py-1 file:px-2
                          file:rounded file:border-0
                          file:text-xs file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
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
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={handleSave}
                >
                  {editingQuestion ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {viewModalOpen && viewingQuestion && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
            <div
              ref={viewModalRef}
              className="bg-white p-8 rounded-lg shadow-xl w-[90%] max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Question Details</h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Question ID</h4>
                    <p className="mt-1 text-lg font-semibold">{viewingQuestion.question_id}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Created By</h4>
                    <p className="mt-1 text-lg">{viewingQuestion.created_by || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Difficulty</h4>
                    <p className="mt-1 text-lg capitalize">{viewingQuestion.difficulty || "N/A"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {viewingQuestion.tags?.length ? (
                        viewingQuestion.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-400">No tags</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Question</h4>
                    {viewingQuestion.text && (
                      <p className="mt-1 text-lg bg-gray-50 p-3 rounded">{viewingQuestion.text}</p>
                    )}
                    {viewingQuestion.imageUrl && (
                      <div className="mt-3">
                        <img 
                          src={viewingQuestion.imageUrl} 
                          alt="Question" 
                          className="max-h-80 w-full object-contain border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-700 mb-4">Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingQuestion.options_text.map((option, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg border-2 ${viewingQuestion.correct_answer === index 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Option {index + 1}</h5>
                            {viewingQuestion.correct_answer === index && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Correct Answer
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-gray-700">{option || "N/A"}</p>
                        </div>
                        {viewingQuestion.optionsImageUrls[index] && (
                          <div className="flex-shrink-0 w-32 h-32">
                            <img 
                              src={viewingQuestion.optionsImageUrls[index]} 
                              alt={`Option ${index + 1}`} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={closeViewModal}
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

export default QuestionsPage;