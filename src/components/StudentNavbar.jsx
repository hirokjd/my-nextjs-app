import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const StudentNavbar = () => {
  const router = useRouter();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/student">
          <a className="text-xl font-bold text-blue-600">Student Portal</a>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/student/exams">
            <a className={`px-3 py-2 rounded-md text-sm font-medium ${
              router.pathname.startsWith('/student/exams') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              My Exams
            </a>
          </Link>
          <Link href="/student/results">
            <a className={`px-3 py-2 rounded-md text-sm font-medium ${
              router.pathname.startsWith('/student/results') 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}>
              Results
            </a>
          </Link>
          <button className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default StudentNavbar;