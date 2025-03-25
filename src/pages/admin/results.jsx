import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Table from "../../components/Table";
import { databases } from "../../utils/appwrite";
import { saveAs } from "file-saver";
import Papa from "papaparse";

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID
      );
      setResults(response.documents);
    } catch (error) {
      console.error("Error fetching results:", error.message);
    }
    setLoading(false);
  };

  const filteredResults = results.filter((result) => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          result.examName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "All" || (filter === "Pass" && result.status === "Pass") || (filter === "Fail" && result.status === "Fail");

    return matchesSearch && matchesFilter;
  });

  const exportToCSV = () => {
    const csvData = Papa.unparse(filteredResults);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "exam_results.csv");
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">📊 Student Exam Results</h2>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Search by Student or Exam Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 rounded w-1/3"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="All">📌 Show All</option>
          <option value="Pass">✅ Passed</option>
          <option value="Fail">❌ Failed</option>
        </select>

        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={exportToCSV}>
          📥 Export CSV
        </button>
      </div>

      {loading ? (
        <p>Loading results...</p>
      ) : (
        <Table
          data={filteredResults.map((result) => ({
            "Student": result.studentName,
            "Exam": result.examName,
            "Score": `${result.score}/${result.totalMarks}`,
            "Status": result.status === "Pass" ? "✅ Pass" : "❌ Fail",
          }))}
        />
      )}
    </AdminLayout>
  );
};

export default ResultsPage;
