"use client";

import { useState } from "react";

const studentsData = [
  { name: "Virat Kohli", rollNo: "018", phone: "123-456-7890", course: "DSA" },
  { name: "MS Dhoni", rollNo: "007", phone: "987-654-3210", course: "OS" },
  { name: "Jasprit Bumrah", rollNo: "093", phone: "555-123-4567", course: "NLP" },
  { name: "Rohit Sharma", rollNo: "045", phone: "999-888-7777", course: "ADS" },
];

const TotalStudents = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredStudents = studentsData.filter(
    (student) =>
      (filter === "All" || student.course === filter) &&
      student.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Total Students</h1>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          className="w-1/2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="w-1/2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All Courses</option>
          <option value="DSA">DSA</option>
          <option value="OS">OS</option>
          <option value="NLP">NLP</option>
          <option value="ADS">ADS</option>
        </select>
      </div>

      {/* Student List */}
      <div className="bg-white p-6 rounded-md shadow-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left text-gray-600">Name</th>
              <th className="p-3 text-left text-gray-600">Roll No.</th>
              <th className="p-3 text-left text-gray-600">Phone</th>
              <th className="p-3 text-left text-gray-600">Course</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.rollNo}</td>
                  <td className="p-3">{student.phone}</td>
                  <td className="p-3">{student.course}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TotalStudents;
