import React from 'react';
import { BarChart2, TrendingUp, Award, Download } from 'lucide-react';

const Results = () => {
  const results = [
    {
      id: 1,
      exam: 'Mathematics Final',
      course: 'Mathematics 101',
      score: 85,
      date: '2025-03-01',
      percentile: 75,
      details: {
        correct: 42,
        incorrect: 8,
        skipped: 0,
        totalQuestions: 50,
        timeSpent: '1h 45m',
      },
    },
    // Add more results here
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Download size={20} />
          <span>Export Results</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {result.exam}
                    </h2>
                    <p className="text-gray-500">{result.course}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {result.score}%
                    </div>
                    <p className="text-sm text-gray-500">Final Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Correct Answers</p>
                    <p className="text-lg font-medium text-gray-900">
                      {result.details.correct}/{result.details.totalQuestions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time Spent</p>
                    <p className="text-lg font-medium text-gray-900">
                      {result.details.timeSpent}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Percentile</p>
                    <p className="text-lg font-medium text-gray-900">
                      {result.percentile}th
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-lg font-medium text-gray-900">{result.date}</p>
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${result.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View Detailed Analysis
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Performance Overview
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart2 className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Score</p>
                    <p className="font-medium text-gray-900">85%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Improvement</p>
                    <p className="font-medium text-gray-900">+12%</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Best Score</p>
                    <p className="font-medium text-gray-900">92%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
            <p className="text-blue-100 mb-4">
              Our academic advisors can help you improve your exam performance.
            </p>
            <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              Schedule Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
