import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import { databases } from "../../utils/appwrite";
import { Query } from "appwrite";

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({ name: "", duration: "", status: "active", scheduled_date: "" });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID
      );
      setExams(response.documents);
    } catch (error) {
      console.error("Error fetching exams:", error.message);
    }
  };

  const openModal = (exam = null) => {
    if (exam) {
      setFormData({
        name: exam.name,
        duration: exam.duration,
        status: exam.status,
        scheduled_date: exam.scheduled_date,
      });
      setSelectedExam(exam);
    } else {
      setFormData({ name: "", duration: "", status: "active", scheduled_date: "" });
      setSelectedExam(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedExam) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
          selectedExam.$id,
          formData
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
          formData
        );
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      console.error("Error saving exam:", error.message);
    }
  };

  const deleteExam = async (examId) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
        examId
      );
      fetchExams();
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Exams</h2>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => openModal()}
      >
        Add Exam
      </button>
      <Table
        data={exams.map((exam) => ({
          Name: exam.name,
          Date: new Date(exam.scheduled_date).toLocaleDateString(),
          Duration: `${exam.duration} min`,
          Status: exam.status,
          Actions: (
            <>
              <button className="text-blue-500 mr-2" onClick={() => openModal(exam)}>Edit</button>
              <button className="text-red-500" onClick={() => deleteExam(exam.$id)}>Delete</button>
            </>
          ),
        }))}
      />
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h3>{selectedExam ? "Edit Exam" : "Add Exam"}</h3>
          <input
            type="text"
            placeholder="Exam Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          />
          <input
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSave}>
            {selectedExam ? "Update" : "Create"} Exam
          </button>
        </Modal>
      )}
    </AdminLayout>
  );
};

export default ExamsPage;
