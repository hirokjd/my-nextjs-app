import React from 'react';
import { Award, Download, Share2, Eye } from 'lucide-react';

const Certificates = () => {
  const certificates = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      course: 'Mathematics 101',
      issueDate: '2025-03-01',
      grade: 'A',
      score: 92,
      image: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&q=80&w=400',
    },
    // Add more certificates here
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Certificates</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Award size={20} />
          <span>View All Achievements</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map((certificate) => (
          <div
            key={certificate.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="relative h-48">
              <img
                src={certificate.image}
                alt={certificate.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm opacity-75">{certificate.course}</p>
                <h3 className="text-lg font-semibold">{certificate.title}</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p className="font-medium text-gray-900">{certificate.issueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Final Grade</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {certificate.grade} ({certificate.score}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download size={18} />
                  <span>Download</span>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Eye size={18} />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-sm p-8 text-white">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Award size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-2">
              Complete More Courses to Earn Certificates
            </h2>
            <p className="text-purple-100 mb-4">
              Enhance your profile with professional certificates. Browse our course catalog
              and start learning today.
            </p>
            <button className="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificates;
