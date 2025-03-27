import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { databases, storage } from "../../utils/appwrite";
import { ID } from "appwrite";

const BUCKET_ID = "questions"; // Appwrite Storage Bucket ID

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question_id: "",
    text: "",
    image_url: "",
    options: ["", "", "", ""],
    option_images: ["", "", "", ""], // ✅ Store option images
    correct_answer: 0,
    difficulty: "easy",
    tags: "",
    created_by: "",
  });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  /** 📌 Fetch all questions from Appwrite */
  const fetchQuestions = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID
      );
      setQuestions(response.documents);
    } catch (error) {
      console.error("Error fetching questions:", error.message);
    }
  };

  /** 📌 Handle image upload */
  const handleImageUpload = async (file, type, index = null) => {
    if (!file) return;

    try {
      // Upload file to Appwrite Storage
      const uploadResponse = await storage.createFile(BUCKET_ID, ID.unique(), file);
      const imageUrl = storage.getFileView(BUCKET_ID, uploadResponse.$id);

      if (type === "question") {
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      } else {
        setFormData((prev) => {
          const updatedOptionImages = [...prev.option_images];
          updatedOptionImages[index] = imageUrl;
          return { ...prev, option_images: updatedOptionImages };
        });
      }
    } catch (error) {
      console.error("Image upload error:", error.message);
    }
  };

  /** 📌 Handle text input changes */
  const handleInputChange = (e, field, index = null) => {
    if (index !== null) {
      setFormData((prev) => {
        const updatedOptions = [...prev.options];
        updatedOptions[index] = e.target.value;
        return { ...prev, options: updatedOptions };
      });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

  /** 📌 Save or update a question */
  const handleSave = async () => {
    if (!formData.question_id || !formData.created_by) {
      alert("Please provide question ID and created by field.");
      return;
    }

    if (!formData.text && !formData.image_url) {
      alert("Please provide either a question text or an image.");
      return;
    }

    const hasValidOption = formData.options.some((option) => option.trim() !== "") || 
                           formData.option_images.some((img) => img !== "");

    if (!hasValidOption) {
      alert("At least one option must have text or an image.");
      return;
    }

    try {
      const isEditing = editingQuestion !== null;
      const questionData = {
        question_id: formData.question_id,
        text: formData.text,
        image_url: formData.image_url,
        options: formData.options,
        option_images: formData.option_images, // ✅ Store option images
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

  /** 📌 Reset the form */
  const resetForm = () => {
    setFormData({
      question_id: "",
      text: "",
      image_url: "",
      options: ["", "", "", ""],
      option_images: ["", "", "", ""], // ✅ Reset option images
      correct_answer: 0,
      difficulty: "easy",
      tags: "",
      created_by: "",
    });
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Create a New Question</h2>
      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4" onClick={() => setModalOpen(true)}>
        + Add Question
      </button>

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

            <input type="file" onChange={(e) => handleImageUpload(e.target.files[0], "question")} />
            {formData.image_url && <img src={formData.image_url} alt="Question Preview" className="w-full h-20 object-cover my-2" />}

            {formData.options.map((option, index) => (
              <div key={index} className="mb-2">
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleInputChange(e, "options", index)}
                />

                <input type="file" onChange={(e) => handleImageUpload(e.target.files[0], "option", index)} />
                {formData.option_images[index] && <img src={formData.option_images[index]} alt={`Option ${index + 1}`} className="w-full h-10 object-cover my-2" />}
              </div>
            ))}

            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>Submit</button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default QuestionsPage;



