import React from 'react';
import StudentLayout from '../../components/StudentLayout';
import Link from 'next/link';

const StudentDashboard = () => {
  return (
    <StudentLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/student/exams"
            className="p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow block"
          >
            <h2 className="text-lg font-semibold text-gray-800">My Exams</h2>
            <p className="mt-2 text-gray-600">View and take your upcoming exams</p>
          </Link>

          <Link
            href="/student/results"
            className="p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow block"
          >
            <h2 className="text-lg font-semibold text-gray-800">Results</h2>
            <p className="mt-2 text-gray-600">Check your exam results</p>
          </Link>

          <Link
            href="/student/profile"
            className="p-6 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow block"
          >
            <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
            <p className="mt-2 text-gray-600">Update your profile information</p>
          </Link>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;