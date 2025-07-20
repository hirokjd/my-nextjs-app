import React, { useEffect, useState } from "react";
import { getCurrentStudentSession, logoutStudent } from "../utils/auth";
import { databases } from "../utils/appwrite"; // Import databases

// Define necessary environment variables
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENT_SESSIONS_COLLECTION_ID;

const StudentHeader = () => {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const currentStudent = getCurrentStudentSession();
    setStudent(currentStudent);

    // --- Session Heartbeat Logic ---
    if (currentStudent && currentStudent.sessionId) {
      const sendHeartbeat = async () => {
        try {
          // Update the timestamp to show the user is still active
          await databases.updateDocument(
            DATABASE_ID,
            SESSIONS_COLLECTION_ID,
            currentStudent.sessionId,
            { last_active_timestamp: new Date().toISOString() }
          );
        } catch (err) {
          console.error("Heartbeat failed:", err);
          // This could mean the session was cleaned up on the server; consider logging out.
        }
      };

      // Send an initial heartbeat immediately when the header loads
      sendHeartbeat();

      // Then, send a heartbeat every 30 seconds
      const heartbeatInterval = setInterval(sendHeartbeat, 30000);

      // Clean up the interval when the component unmounts
      return () => clearInterval(heartbeatInterval);
    }
  }, []);

  const handleLogout = async () => {
    await logoutStudent();
    window.location.href = "/login";
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <div>
        {student ? (
          <>
            <span className="font-semibold text-gray-800">{student.name}</span>
            <span className="ml-3 text-gray-500">{student.email}</span>
          </>
        ) : (
          <span className="text-gray-500">Not logged in</span>
        )}
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
      >
        Logout
      </button>
    </header>
  );
};

export default StudentHeader;
