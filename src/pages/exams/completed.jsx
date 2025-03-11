import React from 'react';
import { CheckCircle, Search, Filter, Download } from 'lucide-react';

const Completed = () => {
  const exams = [
    {
      id: 1,
      title: 'Mathematics Final',
      course: 'Mathematics 101',
      date: '2025-03-01',
      score: 85,
      duration: '2 hours',
      questions: 50,
      correct: 42,
    },
    // Add more completed exams here
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Completed Exams</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            <span>Export Results</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search exams..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-emerald-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{exam.title}</h3>
                      <p className="text-sm text-gray-500">{exam.course}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-emerald-600">
                      {exam.score}%
                    </div>
                    <p className="text-sm text-gray-500">Final Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date Completed</p>
                    <p className="font-medium text-gray-900">{exam.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{exam.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Questions</p>
                    <p className="font-medium text-gray-900">{exam.questions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Correct Answers</p>
                    <p className="font-medium text-gray-900">{exam.correct}</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Completed;
