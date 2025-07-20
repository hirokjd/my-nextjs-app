import React, { useEffect, useState } from "react";
import { databases, Query } from "../../utils/appwrite";
import { useRouter } from "next/router";
import { getCurrentStudentSession } from "../../utils/auth";
import { formatDateTimeUTC } from "../../utils/date";
import { Clock, HelpCircle, CheckCircle } from "lucide-react";

const ENROLLMENTS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID;
const EXAMS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
const EXAM_QUESTIONS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const EnrolledExamsPage = () => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Helper to safely resolve Appwrite's relationship data
  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    if (typeof field === 'object' && field.$id) return field.$id;
    return field;
  };

  useEffect(() => {
    const studentSession = getCurrentStudentSession();
    if (!studentSession || !studentSession.studentId) {
      router.replace("/login");
      return;
    }

    const fetchEnrolledExams = async () => {
      try {
        // 1. Get all data sources in parallel for efficiency
        const [enrollmentsRes, examQuestionsRes] = await Promise.all([
            databases.listDocuments(DATABASE_ID, ENROLLMENTS_COLLECTION, [Query.limit(5000)]),
            databases.listDocuments(DATABASE_ID, EXAM_QUESTIONS_COLLECTION, [Query.limit(5000)])
        ]);

        // 2. Filter enrollments for the current student
        const filteredEnrollments = enrollmentsRes.documents.filter(enrollment =>
          resolveRelationshipId(enrollment.student_id) === studentSession.studentId
        );

        if (filteredEnrollments.length === 0) {
          setExams([]);
          setLoading(false);
          return;
        }

        const examIds = filteredEnrollments.map(enrollment => resolveRelationshipId(enrollment.exam_id)).filter(Boolean);

        if (examIds.length === 0) {
          setExams([]);
          setLoading(false);
          return;
        }

        // 3. Fetch the details for only the exams the student is enrolled in
        const examsRes = await databases.listDocuments(
          DATABASE_ID,
          EXAMS_COLLECTION,
          [Query.equal("$id", examIds)]
        );

        // 4. Filter for active/upcoming exams and enrich them with status, duration, and question count
        const now = new Date();
        const activeAndUpcomingExams = examsRes.documents
          .filter(exam => exam.status === 'active' && new Date(exam.exam_date) > now)
          .map(exam => {
            // Find the specific enrollment document for this exam to check the status
            const enrollment = filteredEnrollments.find(e => resolveRelationshipId(e.exam_id) === exam.$id);
            // Count the questions for this exam from the data we already fetched
            const questionCount = examQuestionsRes.documents.filter(eq => resolveRelationshipId(eq.exam_id) === exam.$id).length;

            return {
              ...exam,
              enrollmentStatus: enrollment ? enrollment.status : 'not_appeared',
              totalQuestions: questionCount
            };
          });

        setExams(activeAndUpcomingExams);
      } catch (err) {
        console.error("Failed to fetch enrolled exams:", err);
        setError("Could not load your exams. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledExams();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Active Exam</h1>
      {exams.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">No Active Exam</h3>
          <p className="text-gray-500 mt-2">There is no active exam available for you at this time.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {exams.map((exam) => (
            <li key={exam.$id} className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between transition hover:shadow-md">
              <div>
                <div className="text-lg font-semibold text-gray-800">{exam.name}</div>
                <div className="text-gray-400 text-sm mt-2">Date: {formatDateTimeUTC(exam.exam_date)}</div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration} Minutes</span>
                    <span className="flex items-center gap-1"><HelpCircle size={14} /> {exam.totalQuestions} Questions</span>
                </div>
              </div>
              
              {exam.enrollmentStatus === 'appeared' ? (
                <div className="mt-4 sm:mt-0 flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold">
                  <CheckCircle size={20} />
                  <span>Completed</span>
                </div>
              ) : (
                <button
                  className="mt-4 sm:mt-0 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  onClick={() => router.push(`/student/exam-instructions/${exam.$id}`)}
                >
                  Start Exam
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EnrolledExamsPage;