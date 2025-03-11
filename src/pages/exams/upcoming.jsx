import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const UpcomingExams = () => {
  const exams = [
    {
      id: 1,
      title: 'Physics Mid-term',
      course: 'Physics 101',
      date: '2025-03-15',
      time: '10:00 AM',
      duration: '2 hours',
      topics: ['Mechanics', 'Thermodynamics', 'Waves'],
      instructions: ['Bring calculator', 'No phones allowed'],
    },
    // Add more upcoming exams here
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Exams</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{exam.title}</h2>
                    <p className="text-gray-500">{exam.course}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-400" />
                    <span className="text-gray-600">{exam.duration}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{exam.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{exam.time}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Topics Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {exam.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-600"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 mt-4 pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                  <ul className="space-y-2">
                    {exam.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-600">
                        <AlertCircle size={16} className="text-amber-500" />
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Prepare for Exam
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Exam Calendar</h2>
            {/* Calendar component would go here */}
            <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
              Calendar Component
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-amber-600" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-amber-900">Important Notice</h2>
            </div>
            <p className="text-amber-800 mb-4">
              Make sure to review all course materials and complete practice tests before your exams.
            </p>
            <button className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
              View Study Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingExams;
