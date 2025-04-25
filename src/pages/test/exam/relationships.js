// pages/test/relationships.js
import { useState, useEffect } from "react";
import { databases, Query } from "../../../utils/appwrite";

const RelationshipsTest = () => {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [examQuestions, setExamQuestions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const questionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
  const examQuestionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, examsCollectionId);
      setExams(response.documents);
    } catch (err) {
      console.error("Error fetching exams:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await databases.listDocuments(databaseId, questionsCollectionId);
      setQuestions(response.documents);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(err.message);
    }
  };

  const fetchExamQuestions = async (examId) => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        examQuestionsCollectionId,
        [Query.equal("exam_id", examId)]
      );
      setExamQuestions(response.documents);
      return response.documents.map(q => q.question_id);
    } catch (err) {
      console.error("Error fetching exam questions:", err);
      setError(err.message);
      return [];
    }
  };

  useEffect(() => {
    fetchExams();
    fetchQuestions();
  }, []);

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setLoading(true);
    try {
      const questionIds = await fetchExamQuestions(exam.$id);
      setSelectedQuestions(questionIds);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const saveRelationships = async () => {
    if (!selectedExam) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // First delete existing relationships
      await Promise.all(
        examQuestions.map(q => 
          databases.deleteDocument(databaseId, examQuestionsCollectionId, q.$id)
        )
      );

      // Then create new relationships
      await Promise.all(
        selectedQuestions.map((questionId, index) => 
          databases.createDocument(
            databaseId,
            examQuestionsCollectionId,
            ID.unique(),
            {
              exam_id: selectedExam.$id,
              question_id: questionId,
              order: index + 1,
              marks: 1 // Default marks
            }
          )
        )
      );

      setSuccess(true);
      fetchExamQuestions(selectedExam.$id);
    } catch (err) {
      console.error("Error saving relationships:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relationship Management Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-2">Exams</h2>
          {loading && !exams.length ? (
            <p>Loading exams...</p>
          ) : (
            <div className="space-y-2">
              {exams.map((exam) => (
                <div
                  key={exam.$id}
                  onClick={() => handleSelectExam(exam)}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedExam?.$id === exam.$id
                      ? "bg-blue-100 border-blue-300"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <h3 className="font-medium">{exam.name}</h3>
                  <p className="text-sm text-gray-600">{exam.exam_id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-2">All Questions</h2>
          {loading && !questions.length ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {questions.map((question) => (
                <div
                  key={question.$id}
                  className={`p-3 border rounded ${
                    selectedQuestions.includes(question.$id)
                      ? "bg-green-100 border-green-300"
                      : "bg-white"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.$id)}
                      onChange={() => handleQuestionToggle(question.$id)}
                      className="mt-1"
                    />
                    <div>
                      <h3 className="font-medium">{question.text || "Question"}</h3>
                      <p className="text-sm text-gray-600">ID: {question.question_id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-2">Current Exam Questions</h2>
          {selectedExam ? (
            <div className="space-y-2">
              {loading ? (
                <p>Loading exam questions...</p>
              ) : examQuestions.length > 0 ? (
                examQuestions.map((eq) => {
                  const question = questions.find(q => q.$id === eq.question_id);
                  return (
                    <div key={eq.$id} className="p-3 border rounded bg-gray-50">
                      {question ? (
                        <>
                          <h3 className="font-medium">{question.text || "Question"}</h3>
                          <p className="text-sm text-gray-600">ID: {question.question_id}</p>
                          <p className="text-sm">Order: {eq.order}</p>
                        </>
                      ) : (
                        <p>Question not found</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p>No questions assigned to this exam</p>
              )}

              {error && (
                <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                  <p>Relationships updated successfully!</p>
                </div>
              )}

              <button
                onClick={saveRelationships}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading || !selectedExam}
              >
                {loading ? "Saving..." : "Save Relationships"}
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded">
              <p>Select an exam to view its questions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipsTest;