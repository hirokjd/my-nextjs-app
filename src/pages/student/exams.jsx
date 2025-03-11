import React, { useState } from "react";
import { FileText, Clock, Users, Search, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

const Exams = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExamId, setExpandedExamId] = useState(null);

  const examsList = [
    {
      id: 1,
      title: "Database And Structure",
      course: "DSA-091",
      description: "This exam covers database indexing, normalization, and query optimization.",
      date: "2025-03-15",
      time: "10:00 AM",
      duration: "2 hours",
      students: 45,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Operating System",
      course: "OS-056",
      description: "Exam on process scheduling, memory management, and file systems.",
      date: "2025-02-20",
      time: "1:00 PM",
      duration: "1.5 hours",
      students: 30,
      status: "active",
    },
    {
      id: 3,
      title: "Natural Language Processing",
      course: "NLP-067",
      description: "Covers NLP fundamentals, text processing, and machine learning models.",
      date: "2025-01-25",
      time: "3:00 PM",
      duration: "2 hours",
      students: 50,
      status: "completed",
    },
  ];

  const filteredExams = examsList.filter(
    (exam) =>
      (activeTab === "all" || exam.status === activeTab) &&
      exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDetails = (id) => {
    setExpandedExamId(expandedExamId === id ? null : id);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search exams..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {["all", "active", "upcoming", "completed"].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === tab ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
              whileHover={{ scale: 1.05 }} // Hover effect
              whileTap={{ scale: 0.95 }} // Click effect
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <motion.div
              key={exam.id}
              className="border border-gray-100 rounded-lg hover:bg-gray-50 transition-all mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Exam Summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{exam.title}</h3>
                    <p className="text-sm text-gray-500">{exam.course}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-gray-400" />
                    <span>{exam.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-gray-400" />
                    <span>{exam.students} students</span>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg mt-2 sm:mt-0"
                  onClick={() => toggleDetails(exam.id)}
                  aria-label="View Details"
                >
                  {expandedExamId === exam.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <span>View Details</span>
                </button>
              </div>

              {/* Expanded Details */}
              {expandedExamId === exam.id && (
                <motion.div
                  className="p-4 bg-gray-50 border-t"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p><strong>Course:</strong> {exam.course}</p>
                  <p><strong>Exam Date:</strong> {exam.date}</p>
                  <p><strong>Time:</strong> {exam.time}</p>
                  <p><strong>Duration:</strong> {exam.duration}</p>
                  <p><strong>Registered Students:</strong> {exam.students}</p>
                  <p><strong>Description:</strong> {exam.description}</p>
                </motion.div>
              )}
            </motion.div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-6">No exams found for this filter.</p>
        )}
      </div>
    </div>
  );
};

export default Exams;
