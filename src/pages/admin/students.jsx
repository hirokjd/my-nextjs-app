import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Modal from "../../components/Modal";
import { databases, account } from "../../utils/appwrite";
import { Plus, Edit, Trash2 } from "lucide-react";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchStudents();
    getUser();
  }, []);

  // Fetch current logged-in user
  const getUser = async () => {
    try {
      const loggedInUser = await account.get();
      setUser(loggedInUser);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // Fetch students from Appwrite
  const fetchStudents = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
      );

      const filteredStudents = response.documents.map((student) => ({
        id: student.$id,
        name: student.name,
        email: student.email,
        password: student.password,
        student_id: student.student_id,
        status: student.status,
        registered_by: student.registered_by || "Unknown",
        registered_date: student.$createdAt
          ? new Date(student.$createdAt).toLocaleDateString()
          : "Not Available",
      }));

      setStudents(filteredStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add new student
  const handleAddStudent = async (studentData) => {
    if (!user) return alert("You must be logged in to add students.");

    try {
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        "unique()",
        {
          ...studentData,
          registered_by: user.name, // Automatically set registered_by
        }
      );
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  // Edit student details
  const handleEditStudent = async (updatedStudent) => {
    try {
      const { registered_date, id, ...studentData } = updatedStudent; // Remove registered_date before update

      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        id,
        studentData
      );

      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  // Delete student
  const handleDeleteStudent = async (studentId) => {
    if (!user || user.labels !== "admin") {
      alert("You do not have permission to delete students.");
      return;
    }

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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Name</th>
                <th className="border border-gray-300 px-4 py-2">Email ID</th>
                <th className="border border-gray-300 px-4 py-2">Password</th>
                <th className="border border-gray-300 px-4 py-2">Student ID</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Registered By</th>
                <th className="border border-gray-300 px-4 py-2">Registered Date</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">{student.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.email}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.password}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.student_id}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.status}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.registered_by}</td>
                  <td className="border border-gray-300 px-4 py-2">{student.registered_date}</td>
                  <td className="border border-gray-300 px-4 py-2 flex justify-center gap-2">
                    {/* Edit Button */}
                    <button
                      className="text-yellow-500 hover:text-yellow-700"
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowModal(true);
                      }}
                    >
                      <Edit size={18} />
                    </button>

                    {/* Delete Button */}
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={selectedStudent ? "Edit Student" : "Add Student"}
          onClose={() => setShowModal(false)}
          onSave={selectedStudent ? handleEditStudent : handleAddStudent}
          initialData={selectedStudent || { status: "active" }}
          fields={[
            { name: "name", label: "Full Name", type: "text" },
            { name: "email", label: "Email ID", type: "email" },
            { name: "password", label: "Password", type: "password" },
            { name: "student_id", label: "Student ID", type: "text" },
            { name: "status", label: "Status", type: "select", options: ["active", "inactive"] },
          ]}
        />
      )}
    </AdminLayout>
  );
};

export default Students;
