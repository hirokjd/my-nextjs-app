import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Table from "../../components/Table"; // Reusable table component
import Modal from "../../components/Modal"; // Reusable modal component
import { databases } from "../../utils/appwrite";
import { Plus, Edit, Trash2 } from "lucide-react";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
      );
      setStudents(response.documents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentData) => {
    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        "unique()", // Auto-generate ID
        studentData
      );
      setShowModal(false);
      fetchStudents(); // Refresh list
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const handleEditStudent = async (updatedStudent) => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        updatedStudent.$id,
        updatedStudent
      );
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        studentId
      );
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Students</h2>
        <button
          onClick={() => {
            setSelectedStudent(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Student
        </button>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : (
        <Table
          data={students}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "enrolledExams", label: "Enrolled Exams" },
            {
              key: "actions",
              label: "Actions",
              render: (student) => (
                <div className="flex gap-2">
                  <button
                    className="text-yellow-500"
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="text-red-500"
                    onClick={() => handleDeleteStudent(student.$id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {showModal && (
        <Modal
          title={selectedStudent ? "Edit Student" : "Add Student"}
          onClose={() => setShowModal(false)}
          onSave={selectedStudent ? handleEditStudent : handleAddStudent}
          initialData={selectedStudent}
          fields={[
            { name: "name", label: "Full Name", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "enrolledExams", label: "Enrolled Exams", type: "text" },
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default Students;
