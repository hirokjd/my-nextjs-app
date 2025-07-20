import { account, databases, ID, Query } from "./appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENT_SESSIONS_COLLECTION_ID;

export const loginAdmin = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const loginStudent = async (email, password) => {
  try {
    // First find the student in your database
    const response = await databases.listDocuments(
      DATABASE_ID,
      STUDENTS_COLLECTION_ID,
      [Query.equal("email", [email])]
    );

    if (response.documents.length === 0) {
      throw new Error("Student not found.");
    }

    const student = response.documents[0];

    // Verify password
    if (student.password !== password) {
      throw new Error("Invalid credentials. Please check your email and password.");
    }

    // Check for existing active sessions for this student
    const activeSessions = await databases.listDocuments(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        [
            Query.equal('students_id', [student.$id]),
            Query.equal('is_active', true)
        ]
    );

    if (activeSessions.documents.length > 0) {
        throw new Error("This account is already logged in on another device.");
    }

    // Create a new session document in the database
    const sessionDoc = await databases.createDocument(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        ID.unique(),
        {
            students_id: student.$id,
            login_at: new Date().toISOString(),
            is_active: true,
            ip_address: '127.0.0.1', // Placeholder, as client-side IP is not reliable
            user_agent: navigator.userAgent, // Store the browser's user agent
        }
    );

    // Return the student session data including the studentId and the new database session ID
    return {
      studentId: student.$id,
      email: student.email,
      name: student.name,
      sessionId: sessionDoc.$id, // Store the session document ID
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentStudentSession = () => {
  if (typeof window !== 'undefined') {
    // Use sessionStorage which clears automatically when the browser tab is closed
    const session = sessionStorage.getItem('studentSession');
    return session ? JSON.parse(session) : null;
  }
  return null;
};

export const logoutStudent = async () => {
  if (typeof window !== 'undefined') {
    const session = getCurrentStudentSession();
    if (session && session.sessionId) {
        try {
            // Mark the session as inactive in the database upon logout
            await databases.updateDocument(
                DATABASE_ID,
                SESSIONS_COLLECTION_ID,
                session.sessionId,
                {
                    is_active: false,
                    logout_at: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error("Failed to update session on logout:", error);
            // We still want to log the user out on the client-side even if the DB update fails
        }
    }
    // Remove the session from sessionStorage
    sessionStorage.removeItem('studentSession');
  }
};
