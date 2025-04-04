import React from 'react';
import Head from 'next/head';
import StudentNavbar from './StudentNavbar';

const StudentLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Student Portal</title>
        <meta name="description" content="Student examination portal" />
      </Head>
      
      <StudentNavbar />
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;