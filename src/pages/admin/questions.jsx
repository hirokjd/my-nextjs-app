import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { databases } from "../../utils/appwrite";
import { ID } from "appwrite";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    question_id: "",
    text: "",
    image_url: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    difficulty: "easy",
    tags: "",
    created_by: "",
  });

  /** 📌 Fetch Questions on Component Mount */
  useEffect(() => {
    fetchQuestions();
  }, []);

  /** 📌 Fetch Questions from Appwrite */
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID
      );
      setQuestions(response.documents);
    } catch (error) {
      console.error("Error fetching questions:", error.message);
    } finally {
      setLoading(false);
    }
  };

  /** 📌 Handle Input Changes */
  const handleInputChange = (e, field, index = null) => {
    setFormData((prev) => {
      if (index !== null) {
        const updatedOptions = [...prev.options];
        updatedOptions[index] = e.target.value;
        return { ...prev, options: updatedOptions };
      }
      return { ...prev, [field]: e.target.value };
    });
  };

  /** 📌 Validate Form Data */
  const validateForm = () => {
    if (!formData.question_id || !formData.created_by) {
      alert("Please provide both Question ID and Created By.");
      return false;
    }
    if (!formData.text && !formData.image_url) {
      alert("Please provide either a Question Text or an Image.");
      return false;
    }
    if (!formData.options.some((option) => option.trim() !== "")) {
      alert("At least one option must have text.");
      return false;
    }
    return true;
  };

  /** 📌 Save or Update a Question */
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const isEditing = editingQuestion !== null;
      const questionData = {
        question_id: formData.question_id,
        text: formData.text,
        image_url: formData.image_url,
        options: formData.options,
        correct_answer: formData.correct_answer,
        difficulty: formData.difficulty,
        tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
        created_by: formData.created_by,
      };

      if (isEditing) {
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
          formData.question_id,
          questionData
        );
      }

      setModalOpen(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error.message);
    }
  };

  /** 📌 Reset Form */
  const resetForm = () => {
    setFormData({
      question_id: "",
      text: "",
      image_url: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      difficulty: "easy",
      tags: "",
      created_by: "",
    });
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Questions</h2>

      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4" onClick={() => setModalOpen(true)}>
        + Add Question
      </button>

      {loading ? <p>Loading questions...</p> : null}

      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Create a New Question</h3>

            <input
              className="border rounded px-3 py-2 mb-2 w-full"
              placeholder="Question ID"
              value={formData.question_id}
              onChange={(e) => handleInputChange(e, "question_id")}
            />

            <input
              className="border rounded px-3 py-2 mb-2 w-full"
              placeholder="Created By"
              value={formData.created_by}
              onChange={(e) => handleInputChange(e, "created_by")}
            />

            <textarea
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="Enter question..."
              value={formData.text}
              onChange={(e) => handleInputChange(e, "text")}
            />

            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleInputChange(e, "options", index)}
                />
                <input
                  type="radio"
                  name="correct_answer"
                  checked={formData.correct_answer === index}
                  onChange={() => setFormData({ ...formData, correct_answer: index })}
                />
              </div>
            ))}

            <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4" onClick={handleSave}>Submit</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default QuestionsPage;
