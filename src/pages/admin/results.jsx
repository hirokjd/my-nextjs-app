import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Table from "../../components/Table";
import { databases } from "../../utils/appwrite";
import { Query } from "appwrite";

const ResultsPage = () => {
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID
      );
      setResults(response.documents);
    } catch (error) {
      console.error("Error fetching results:", error.message);
    }
  };

  const exportCSV = () => {
    let csvContent = "Student Name,Exam,Score,Percentage,Pass/Fail\n";
    results.forEach((res) => {
      csvContent += `${res.studentName},${res.examName},${res.score},${res.percentage},${res.pass ? "Pass" : "Fail"}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exam_results.csv";
    a.click();
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Results & Analytics</h2>

      {/* Search Filter */}
      <input
        type="text"
        placeholder="Search by Student or Exam..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
      />

      <button className="bg-green-500 text-white px-4 py-2 rounded mb-4" onClick={exportCSV}>
        Export CSV
      </button>

      {/* Results Table */}
      <Table
        data={results
          .filter((res) => res.studentName.includes(searchTerm) || res.examName.includes(searchTerm))
          .map((res) => ({
            "Student Name": res.studentName,
            "Exam Name": res.examName,
            "Score": res.score,
            "Percentage": `${res.percentage}%`,
            "Pass/Fail": res.pass ? "✅ Pass" : "❌ Fail",
          }))}
      />
    </AdminLayout>
  );
};

export default ResultsPage;
