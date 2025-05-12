import React from 'react';
import Link from 'next/link';
import { FiBook, FiAward, FiUser, FiCalendar, FiClock, FiBarChart2 } from 'react-icons/fi';

// Move date formatting to a consistent function
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const StudentDashboard = () => {
  // Mock data - using consistent date format
  const upcomingExams = [
    { id: 1, name: 'Mathematics Midterm', date: '2023-11-15', duration: '90 mins' },
    { id: 2, name: 'Science Final', date: '2023-11-22', duration: '120 mins' }
  ];

  const recentResults = [
    { id: 1, exam: 'History Quiz', score: '85%', date: '2023-10-28' },
    { id: 2, exam: 'English Test', score: '92%', date: '2023-11-05' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, John!</h1>
        <p className="opacity-90">You have {upcomingExams.length} upcoming exams this month</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/student/exams" passHref>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <FiBook className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">My Exams</h2>
              <p className="mt-1 text-gray-600 text-sm">View and take upcoming exams</p>
            </div>
          </div>
        </Link>

        <Link href="/student/results" passHref>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <FiAward className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Results</h2>
              <p className="mt-1 text-gray-600 text-sm">Check your exam results</p>
            </div>
          </div>
        </Link>

        <Link href="/student/profile" passHref>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <FiUser className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
              <p className="mt-1 text-gray-600 text-sm">Update your information</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Upcoming Exams Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiCalendar className="mr-2 text-blue-600" />
            Upcoming Exams
          </h2>
          <Link href="/student/exams" passHref>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
          </Link>
        </div>

        <div className="space-y-4">
          {upcomingExams.length > 0 ? (
            upcomingExams.map((exam) => (
              <div key={exam.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <FiClock className="mr-1" /> {exam.duration}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">{formatDate(exam.date)}</p>
                    <Link href={`/student/exams/${exam.id}`} passHref>
                      <button className="mt-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No upcoming exams scheduled</p>
          )}
        </div>
      </div>

      {/* Recent Results Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FiBarChart2 className="mr-2 text-green-600" />
            Recent Results
          </h2>
          <Link href="/student/results" passHref>
            <span className="text-sm text-blue-600 hover:underline cursor-pointer">View All</span>
          </Link>
        </div>

        <div className="space-y-4">
          {recentResults.length > 0 ? (
            recentResults.map((result) => (
              <div key={result.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-800">{result.exam}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(result.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      parseFloat(result.score) >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(result.score) >= 50 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {result.score}
                    </span>
                    <Link href={`/student/results/${result.id}`} passHref>
                      <button className="mt-2 px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No results available yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;