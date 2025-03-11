import React, { useState } from "react";
import { useRouter } from "next/router"; // Use Next.js router
import { Upload, Clock, Users, FileText, Plus, X, Edit, Trash } from "lucide-react";

const Create = () => {
  const router = useRouter(); // Initialize Next.js router

  // State for form inputs
  const [examTitle, setExamTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [duration, setDuration] = useState("");
  const [restrictToAppliedStudents, setRestrictToAppliedStudents] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [manualQuestions, setManualQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [error, setError] = useState("");
  const [inputMethod, setInputMethod] = useState("csv"); // Track input method
  const [editingIndex, setEditingIndex] = useState(null); // Track which question is being edited

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setError("");
    } else {
      setError("Please upload a valid CSV file.");
    }
  };

  // Handle adding or updating a manual MCQ
  const addOrUpdateManualQuestion = () => {
    if (newQuestion.trim() && newOptions.every(option => option.trim())) {
      const newMCQ = {
        question: newQuestion.trim(),
        options: newOptions.map(option => option.trim()),
        correctAnswer: correctAnswer.trim()
      };

      if (editingIndex !== null) {
        const updatedQuestions = [...manualQuestions];
        updatedQuestions[editingIndex] = newMCQ;
        setManualQuestions(updatedQuestions);
        setEditingIndex(null);
      } else {
        setManualQuestions([...manualQuestions, newMCQ]);
      }

      setNewQuestion("");
      setNewOptions(["", "", "", ""]);
      setCorrectAnswer("");
    } else {
      setError("Please fill out all fields for the question.");
    }
  };

  // Handle editing a question
  const handleEditQuestion = (index) => {
    const question = manualQuestions[index];
    setNewQuestion(question.question);
    setNewOptions(question.options);
    setCorrectAnswer(question.correctAnswer);
    setEditingIndex(index);
  };

  // Handle deleting a question
  const handleDeleteQuestion = (index) => {
    setManualQuestions(manualQuestions.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!examTitle || !courseCode || !examDate || !examTime || !duration) {
      setError("Please fill out all fields.");
      return;
    }

    if (inputMethod === "csv" && !csvFile) {
      setError("Please upload a CSV file.");
      return;
    }

    if (inputMethod === "manual" && manualQuestions.length === 0) {
      setError("Please add at least one question.");
      return;
    }

    if (inputMethod === "csv" && csvFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        const questions = text.split("\n").map(line => line.trim());
        console.log("Parsed Questions from CSV:", questions);
      };
      reader.readAsText(csvFile);
    } else if (inputMethod === "manual") {
      console.log("Manual Questions:", manualQuestions);
    }

    setExamTitle("");
    setCourseCode("");
    setExamDate("");
    setExamTime("");
    setDuration("");
    setCsvFile(null);
    setManualQuestions([]);
    setError("");
    router.push("/exams"); // Navigate to the exams page after submission
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Exam</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        {/* Exam Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam Title</label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter the exam title"
          />
        </div>

        {/* Course Code */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter the course code"
          />
        </div>

        {/* Exam Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Exam Time */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam Time</label>
          <input
            type="time"
            value={examTime}
            onChange={(e) => setExamTime(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Input Method (CSV or Manual) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Input Method</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg"
            value={inputMethod}
            onChange={(e) => setInputMethod(e.target.value)}
          >
            <option value="csv">CSV Upload</option>
            <option value="manual">Manual Input</option>
          </select>
        </div>

        {/* CSV File Upload */}
        {inputMethod === "csv" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {/* Manual Questions */}
        {inputMethod === "manual" && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Questions</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Enter the question"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              {newOptions.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const updatedOptions = [...newOptions];
                    updatedOptions[index] = e.target.value;
                    setNewOptions(updatedOptions);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                  placeholder={`Option ${index + 1}`}
                />
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Enter the correct answer"
              />
            </div>

            <button
              type="button"
              onClick={addOrUpdateManualQuestion}
              className="w-full p-3 bg-blue-500 text-white rounded-lg mt-4"
            >
              {editingIndex !== null ? "Update Question" : "Add Question"}
            </button>

            <div className="mt-6">
              {manualQuestions.length > 0 && (
                <ul>
                  {manualQuestions.map((question, index) => (
                    <li key={index} className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{question.question}</h4>
                        <ul className="text-sm text-gray-600">
                          {question.options.map((option, idx) => (
                            <li key={idx}>{option}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <button
                          onClick={() => handleEditQuestion(index)}
                          className="text-blue-500 mr-2"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="text-red-500"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-lg"
        >
          Create Exam
        </button>
      </form>
    </div>
  );
};

export default Create;
