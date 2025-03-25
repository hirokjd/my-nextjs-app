import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import { databases, ID } from "../../utils/appwrite";
import { account } from "../../utils/appwrite"; // ✅ Ensure account is imported

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({
    exam_id: "", // ✅ Added exam_id field
    name: "",
    description: "",
    exam_date: "",
    duration: "",
    status: "active",
  });

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;

  useEffect(() => {
    fetchExams();
  }, []);

  // ✅ Fetch Exams from Appwrite
  const fetchExams = async () => {
    try {
      if (!databaseId || !collectionId) {
        console.error("Missing Database ID or Collection ID. Check .env file.");
        return;
      }

      const response = await databases.listDocuments(databaseId, collectionId);
      setExams(response.documents || []);
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  // ✅ Open Modal for Create/Edit
  const openModal = (exam = null) => {
    if (exam) {
      setFormData({
        exam_id: exam.exam_id || "",
        name: exam.name || "",
        description: exam.description || "",
        exam_date: exam.exam_date || "",
        duration: exam.duration || "",
        status: exam.status || "active",
      });
      setSelectedExam(exam);
    } else {
      setFormData({
        exam_id: "",
        name: "",
        description: "",
        exam_date: "",
        duration: "",
        status: "active",
      });
      setSelectedExam(null);
    }
    setIsModalOpen(true);
  };

  // ✅ Handle Save (Create/Update)
  const handleSave = async (data) => {
    try {
      console.log("Account Object:", account);
  
      // Get the logged-in user
      const user = await account.get();
      const userId = user?.$id || "unknown";
  
      // Validate required fields
      if (!data.exam_id) {
        alert("Exam ID is required.");
        return;
      }
  
      // Convert duration to an integer (Fixes the error)
      const durationInt = parseInt(data.duration, 10);
      if (isNaN(durationInt)) {
        alert("Duration must be a valid number.");
        return;
      }
  
      const timestamp = new Date().toISOString(); // ✅ Generate ISO timestamp
  
      if (selectedExam) {
        // ✅ Update existing exam
        await databases.updateDocument(
          databaseId,
          collectionId,
          selectedExam.$id,
          {
            ...data,
            duration: durationInt, // ✅ Ensure duration is an integer
            modified_at: timestamp, // ✅ Update modification timestamp
          }
        );
      } else {
        // ✅ Ensure all required fields are included
        const newExam = {
          exam_id: data.exam_id, // Required Unique ID
          name: data.name,
          description: data.description || "", // Optional
          exam_date: data.exam_date, // Required
          duration: durationInt, // ✅ Converted to integer
          status: data.status, // Required ENUM ("active", "inactive", "completed")
          created_by: userId, // Required
          created_at: timestamp, // ✅ Required: Creation timestamp
          modified_at: timestamp, // ✅ Set modification timestamp initially same as created_at
        };
  
        await databases.createDocument(databaseId, collectionId, ID.unique(), newExam);
      }
  
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      console.error("Error saving exam:", error);
    }
  };
  

  // ✅ Handle Delete
  const deleteExam = async (examId) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      try {
        await databases.deleteDocument(databaseId, collectionId, examId);
        fetchExams(); // Refresh list
      } catch (error) {
        console.error("Error deleting exam:", error);
      }
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Manage Exams</h2>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={() => openModal()}
      >
        + Add Exam
      </button>
      <Table
        data={exams?.map((exam) => ({
          ExamID: exam.exam_id, // ✅ Display Exam ID
          Name: exam.name,
          Description: exam.description || "N/A",
          Date: exam.exam_date ? new Date(exam.exam_date).toLocaleString() : "N/A",
          Duration: `${exam.duration} min`,
          Status: exam.status,
          Actions: (
            <>
              <button className="text-blue-500 mr-2" onClick={() => openModal(exam)}>Edit</button>
              <button className="text-red-500" onClick={() => deleteExam(exam.$id)}>Delete</button>
            </>
          ),
        })) || []}
      />
      {isModalOpen && (
        <Modal
          title={selectedExam ? "Edit Exam" : "Add Exam"}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave} // ✅ Ensure function binding
          initialData={formData}
          fields={[
            { name: "exam_id", label: "Exam ID", type: "text" }, // ✅ Added Exam ID input
            { name: "name", label: "Exam Name", type: "text" },
            { name: "description", label: "Description", type: "text" },
            { name: "exam_date", label: "Exam Date", type: "datetime-local" },
            { name: "duration", label: "Duration (minutes)", type: "number" },
            {
              name: "status",
              label: "Status",
              type: "select",
              options: ["active", "inactive", "completed"],
            },
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default ExamsPage;
