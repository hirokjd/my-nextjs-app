// src/utils/auth.js
import { account, databases, ID } from "./appwrite";
import { Query } from "appwrite";

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
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
      [Query.equal("email", [email])]
    );

    if (response.documents.length === 0) {
      throw new Error("Student not found.");
    }

    const student = response.documents[0];

    // Verify password (in production, use proper password hashing)
    if (student.password !== password) {
      throw new Error("Invalid credentials. Please check your email and password.");
    }

    // Return the student session data including the studentId
    return {
      studentId: student.$id,  // Make sure this matches your collection's ID field
      email: student.email,
      name: student.name,
      // Add any other relevant student data
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getCurrentStudentSession = () => {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('studentSession');
    return session ? JSON.parse(session) : null;
  }
  return null;
};

export const logoutStudent = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('studentSession');
  }
};