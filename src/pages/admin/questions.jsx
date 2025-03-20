import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import { databases } from "../../utils/appwrite";
import { Query } from "appwrite";

const QuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 1,
    difficulty: "Easy",
    category: "",
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

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

  const openModal = (question = null) => {
    if (question) {
      setFormData({
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        category: question.category,
      });
      setSelectedQuestion(question);
    } else {
      setFormData({ text: "", options: ["", "", "", ""], correctAnswer: 1, difficulty: "Easy", category: "" });
      setSelectedQuestion(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedQuestion) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
          selectedQuestion.$id,
          formData
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
          formData
        );
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error.message);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (confirm("Are you sure you want to delete this question?")) {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID,
        questionId
      );
      fetchQuestions();
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Questions</h2>
      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4" onClick={() => openModal()}>
        Add Question
      </button>
      <Table
        data={questions.map((question) => ({
          Question: question.text,
          Difficulty: question.difficulty,
          Category: question.category,
          Actions: (
            <>
              <button className="text-blue-500 mr-2" onClick={() => openModal(question)}>Edit</button>
              <button className="text-red-500" onClick={() => deleteQuestion(question.$id)}>Delete</button>
            </>
          ),
        }))}
      />
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h3>{selectedQuestion ? "Edit Question" : "Add Question"}</h3>
          <input
            type="text"
            placeholder="Question Text"
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          />
          {formData.options.map((option, index) => (
            <input
              key={index}
              type="text"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const updatedOptions = [...formData.options];
                updatedOptions[index] = e.target.value;
                setFormData({ ...formData, options: updatedOptions });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
            />
          ))}
          <select
            value={formData.correctAnswer}
            onChange={(e) => setFormData({ ...formData, correctAnswer: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          >
            {formData.options.map((_, index) => (
              <option key={index} value={index + 1}>
                Correct Answer: {index + 1}
              </option>
            ))}
          </select>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <input
            type="text"
            placeholder="Category (e.g., Networking, OS)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          />
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSave}>
            {selectedQuestion ? "Update" : "Create"} Question
          </button>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default QuestionsPage;
