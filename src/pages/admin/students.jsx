"use client";

import { Users } from "lucide-react";

const students = [
  { id: 1, name: "Alice Johnson", course: "Advanced Mathematics" },
  { id: 2, name: "Bob Williams", course: "Physics Fundamentals" },
  { id: 3, name: "Charlie Brown", course: "Computer Science Basics" },
  { id: 4, name: "David Smith", course: "Chemistry Essentials" },
  { id: 5, name: "Evelyn Clark", course: "Machine Learning" },
];

const Students = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Students</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Registered Students</h2>

        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{student.name}</p>
                <p className="text-sm text-gray-500">Enrolled in {student.course}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Students;
