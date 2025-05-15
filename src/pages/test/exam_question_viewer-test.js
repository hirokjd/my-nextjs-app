import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { Query } from 'appwrite';

const ExamQuestionsViewerPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examQuestions, setExamQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const examQuestionsCollectionId = 'exam_questions';
  const questionsCollectionId = 'questions';
  const examsCollectionId = 'exams';

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(databaseId, examsCollectionId, [Query.limit(100)]);
      setExams(response.documents);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsForExam = async (examId) => {
    if (!examId) return;
    
    setLoading(true);
    try {
      // First, get all exam_question documents
      const examQuestionsResponse = await databases.listDocuments(
        databaseId, 
        examQuestionsCollectionId,
        [Query.orderAsc('order')]
      );
      
      // Filter locally for this exam
      const filteredExamQuestions = examQuestionsResponse.documents.filter(doc => {
        // Handle both array and direct reference formats
        const examRef = doc.exam_id;
        if (Array.isArray(examRef)) {
          return examRef.some(ref => ref.$id === examId || ref === examId);
        } else if (typeof examRef === 'object') {
          return examRef.$id === examId;
        }
        return examRef === examId;
      });

      setExamQuestions(filteredExamQuestions);

      // Get all the questions referenced in these mappings
      const questionIds = filteredExamQuestions.map(eq => {
        const questionRef = eq.question_id;
        if (Array.isArray(questionRef)) {
          return questionRef[0]?.$id || questionRef[0];
        } else if (typeof questionRef === 'object') {
          return questionRef.$id;
        }
        return questionRef;
      }).filter(id => id);

      if (questionIds.length > 0) {
        // Fetch all questions at once
        const questionsResponse = await databases.listDocuments(
          databaseId,
          questionsCollectionId,
          [Query.limit(100)]
        );
        
        // Filter questions locally to match our questionIds
        const filteredQuestions = questionsResponse.documents.filter(q => 
          questionIds.includes(q.$id) || questionIds.includes(q.question_id)
        );
        setQuestions(filteredQuestions);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching questions for exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExamId(examId);
    fetchQuestionsForExam(examId);
  };

  const getQuestionById = (questionId) => {
    return questions.find(q => q.$id === questionId) || 
           questions.find(q => q.question_id === questionId);
  };

  const getQuestionOrder = (questionId) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = Array.isArray(qRef) ? qRef[0]?.$id || qRef[0] : 
                   (typeof qRef === 'object' ? qRef.$id : qRef);
      return refId === questionId;
    });
    return mapping?.order || 'N/A';
  };

  const getQuestionMarks = (questionId) => {
    const mapping = examQuestions.find(eq => {
      const qRef = eq.question_id;
      const refId = Array.isArray(qRef) ? qRef[0]?.$id || qRef[0] : 
                   (typeof qRef === 'object' ? qRef.$id : qRef);
      return refId === questionId;
    });
    return mapping?.marks || 'N/A';
  };

  useEffect(() => {
    fetchExams();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Exam Questions Viewer</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
          <select
            value={selectedExamId}
            onChange={handleExamChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            disabled={loading}
          >
            <option value="">Choose an exam</option>
            {exams.map((exam) => (
              <option key={exam.$id} value={exam.$id}>
                {exam.name} ({exam.exam_id})
              </option>
            ))}
          </select>
        </div>

        {selectedExamId && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">
              Questions for {exams.find(e => e.$id === selectedExamId)?.name || 'Selected Exam'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Exam ID: {selectedExamId}
            </p>

            {loading && questions.length === 0 ? (
              <div className="text-center py-8">
                <p>Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <p>No questions found for this exam</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.$id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          Question {getQuestionOrder(question.$id)} (Marks: {getQuestionMarks(question.$id)})
                        </h3>
                        <p className="text-gray-700 mt-1">{question.text}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {question.difficulty && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Difficulty: {question.difficulty}
                            </span>
                          )}
                          {question.topic && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              Topic: {question.topic}
                            </span>
                          )}
                          {question.type && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              Type: {question.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          ID: {question.$id}
                        </span>
                        {question.question_id && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            Question ID: {question.question_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamQuestionsViewerPage;