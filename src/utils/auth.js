import { account, databases } from "./appwrite";
import { Query } from "appwrite";

export const loginAdmin = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    console.log("Admin session:", session); // ✅ Log session data
    return session;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getStudentByEmail = async (email) => {
  try {
    console.log("Database ID:", process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
    console.log("Students Collection ID:", process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID);

    const response = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
      [Query.equal("email", [email])] // ✅ Use Query helper
    );

    if (response.documents.length === 0) {
      throw new Error("Student not found.");
    }

    return response.documents[0]; // Return student data
  } catch (error) {
    throw new Error(error.message);
  }
};

export const loginStudent = async (email, password) => {
  try {
    const student = await getStudentByEmail(email);

    // Direct password comparison (No encryption)
    if (student.password !== password) {
      throw new Error("Invalid student credentials.");
    }

    console.log("Student logged in successfully:", student); // ✅ Debugging log
    return student;
  } catch (error) {
    throw new Error(error.message);
  }
};
