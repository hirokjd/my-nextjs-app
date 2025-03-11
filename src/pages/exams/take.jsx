import React, { useState } from 'react';
import { Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const TakeExam = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const exam = {
    title: 'Mathematics Final Exam',
    duration: '2 hours',
    totalQuestions: 50,
    questions: [
      {
        id: 1,
        question: 'What is the solution to the equation 2x + 5 = 13?',
        options: ['x = 4', 'x = 6', 'x = 8', 'x = 10'],
        type: 'single',
      },
      {
        id: 2,
        question: 'solution to the equation 2x + 5 = 13?',
        options: ['x = 4', 'x = 6', 'x = 8', 'x = 10'],
        type: 'single',
      },
      // Add more questions here
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
            <p className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {exam.totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              <span className="text-lg font-medium text-gray-900">01:45:30</span>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Submit Exam
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600"
            style={{ width: `${((currentQuestion + 1) / exam.totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Area */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {exam.questions[currentQuestion].question}
              </h2>
              <div className="space-y-3">
                {exam.questions[currentQuestion].options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button
                onClick={() => setCurrentQuestion(Math.min(exam.totalQuestions - 1, currentQuestion + 1))}
                disabled={currentQuestion === exam.totalQuestions - 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {Array.from({ length: exam.totalQuestions }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                  currentQuestion === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;
