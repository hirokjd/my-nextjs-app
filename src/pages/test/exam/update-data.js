// pages/test/update-data.js
import { useState, useEffect } from "react";
import { databases } from "../../../utils/appwrite";

const UpdateDataTest = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSelect = (doc) => {
    setSelectedDoc(doc);
    setFormData({
      name: doc.name,
      description: doc.description,
      status: doc.status,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await databases.updateDocument(
        databaseId,
        collectionId,
        selectedDoc.$id,
        formData
      );
      setSuccess(true);
      fetchDocuments();
    } catch (err) {
      console.error("Error updating document:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Update Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Select Document</h2>
          {loading && !documents.length ? (
            <p>Loading documents...</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.$id}
                  onClick={() => handleSelect(doc)}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedDoc?.$id === doc.$id
                      ? "bg-blue-100 border-blue-300"
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
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold mb-2">Edit Document</h2>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {error && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                  <p>Document updated successfully!</p>
                </div>
              )}

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Document"}
              </button>
            </form>
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p>Select a document to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateDataTest;