// import React from 'react';
// import Link from 'next/link';
// import { useRouter } from 'next/router';

// const StudentNavbar = () => {
//   const router = useRouter();

//   const navLinkClass = (path) =>
//     `px-3 py-2 rounded-md text-sm font-medium ${
//       router.pathname.startsWith(path)
//         ? 'bg-blue-100 text-blue-700'
//         : 'text-gray-700 hover:bg-gray-100'
//     }`;

//   return (
//     <nav className="bg-white shadow-sm">
//       <div className="container mx-auto px-4 py-3 flex justify-between items-center">
//         <Link href="/student" className="text-xl font-bold text-blue-600">
//           Student Portal
//         </Link>
//         <div className="flex items-center space-x-4">
//           <Link href="/student/exams" className={navLinkClass('/student/exams')}>
//             My Exams
//           </Link>
//           <Link href="/student/results" className={navLinkClass('/student/results')}>
//             Results
//           </Link>
//           <button className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium">
//             Logout
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default StudentNavbar;
