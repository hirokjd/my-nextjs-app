import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { databases } from "@/utils/appwrite";
import { Query } from "appwrite";

const ResponsesPage = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const RESPONSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID;

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(
        DATABASE_ID,
        RESPONSES_COLLECTION_ID,
        [Query.orderDesc("$createdAt")]
      );
      setResponses(res.documents);
    } catch (err) {
      console.error("Failed to fetch responses:", err);
      setError("You are not authorized to access responses or something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">📄 Student Responses</h1>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
            <button
              onClick={fetchResponses}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : responses.length === 0 ? (
          <p className="text-gray-500">No responses found.</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow-md rounded-lg p-4">
            <table className="min-w-full text-sm text-left border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Response ID</th>
                  <th className="p-2 border">Student ID</th>
                  <th className="p-2 border">Exam ID</th>
                  <th className="p-2 border">Question ID</th>
                  <th className="p-2 border">Selected Option</th>
                  <th className="p-2 border">Created At</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((res) => (
                  <tr key={res.$id} className="hover:bg-gray-50">
                    <td className="p-2 border">{res.response_id}</td>
                    <td className="p-2 border">{res.student_id || "N/A"}</td>
                    <td className="p-2 border">{res.exam_id || "N/A"}</td>
                    <td className="p-2 border">{res.question_id || "N/A"}</td>
                    <td className="p-2 border">{res.selected_option}</td>
                    <td className="p-2 border">{new Date(res.$createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ResponsesPage;
