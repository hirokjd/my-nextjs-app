// pages/test/delete-data.js
import { useState, useEffect } from "react";
import { databases } from "../../../utils/appwrite";

const DeleteDataTest = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, collectionId);
      setDocuments(response.documents);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async () => {
    if (!selectedDoc) return;
    if (!confirm(`Are you sure you want to delete "${selectedDoc.name}"?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await databases.deleteDocument(databaseId, collectionId, selectedDoc.$id);
      setSuccess(true);
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Deletion Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Documents</h2>
          {loading && !documents.length ? (
            <p>Loading documents...</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.$id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedDoc?.$id === doc.$id
                      ? "bg-red-100 border-red-300"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium">{doc.name}</h3>
                  <p className="text-sm text-gray-600">{doc.exam_id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {selectedDoc ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">Delete Document</h2>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-lg font-medium mb-2">{selectedDoc.name}</h3>
                <p className="text-gray-600 mb-2">ID: {selectedDoc.exam_id}</p>
                <p className="text-gray-600 mb-4">
                  Created: {new Date(selectedDoc.$createdAt).toLocaleString()}
                </p>
                <p className="mb-4">{selectedDoc.description}</p>

                {error && (
                  <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    <p>{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                    <p>Document deleted successfully!</p>
                  </div>
                )}

                <button
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete Document"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p>Select a document to delete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteDataTest;