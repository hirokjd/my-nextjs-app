import { useState, useEffect } from 'react';
import { databases } from '../../../utils/appwrite';
import { Query } from 'appwrite';

const StudentExamResponsesViewer = ({ examId, studentId }) => {
  const [responses, setResponses] = useState([]);
  const [exam, setExam] = useState(null);
  const [student, setStudent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const collectionId = 'responses';

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch exam, student, and responses in parallel
      const [examRes, studentRes, responsesRes] = await Promise.all([
        databases.getDocument(databaseId, 'exams', examId),
        databases.getDocument(databaseId, 'students', studentId),
        databases.listDocuments(databaseId, collectionId, [
          Query.equal('exam_id', examId),
          Query.equal('student_id', studentId),
          Query.orderAsc('$createdAt')
        ])
      ]);

      setExam(examRes);
      setStudent(studentRes);
      setResponses(responsesRes.documents);

      // Fetch all questions referenced in responses
      const questionIds = responsesRes.documents.map(r => 
        typeof r.question_id === 'object' ? r.question_id.$id : r.question_id
      ).filter(id => id);
      
      if (questionIds.length > 0) {
        const questionsRes = await databases.listDocuments(databaseId, 'questions', [
          Query.equal('$id', questionIds)
        ]);
        setQuestions(questionsRes.documents);
      }

    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionById = (questionId) => {
    if (!questionId) return null;
    const resolvedId = typeof questionId === 'object' ? questionId.$id : questionId;
    return questions.find(q => q.$id === resolvedId || q.question_id === resolvedId);
  };

  const getCorrectAnswerText = (question, selectedOption) => {
    if (!question || !question.options || !Array.isArray(question.options)) return 'N/A';
    
    const correctIndex = question.correct_answer;
    const selectedIndex = parseInt(selectedOption);
    
    const correctText = question.options[correctIndex] || 'N/A';
    const selectedText = question.options[selectedIndex] || 'N/A';
    
    return {
      correctText,
      selectedText,
      isCorrect: correctIndex === selectedIndex
    };
  };

  const formatDifficulty = (difficulty) => {
    if (!difficulty) return '';
    const colors = {
      easy: 'text-green-600',
      medium: 'text-yellow-600',
      hard: 'text-red-600'
    };
    return (
      <span className={`text-xs uppercase font-semibold ${colors[difficulty] || ''}`}>
        ({difficulty})
      </span>
    );
  };

  useEffect(() => {
    if (examId && studentId) {
      fetchAllData();
    }
  }, [examId, studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p>Loading exam responses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
        <p>Error loading responses: {error}</p>
      </div>
    );
  }

  if (!exam || !student) {
    return (
      <div className="text-center py-8">
        <p>No exam or student data found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {exam.name} Responses
      </h1>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-gray-700">Student:</h3>
            <p>{student.name} ({student.student_id})</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Exam:</h3>
            <p>{exam.name} ({exam.exam_id})</p>
          </div>
          {exam.exam_date && (
            <div>
              <h3 className="font-semibold text-gray-700">Exam Date:</h3>
              <p>{new Date(exam.exam_date).toLocaleDateString()}</p>
            </div>
          )}
          {exam.duration && (
            <div>
              <h3 className="font-semibold text-gray-700">Duration:</h3>
              <p>{exam.duration} minutes</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <p>No responses found for this exam</p>
          </div>
        ) : (
          responses.map((response, index) => {
            const question = getQuestionById(response.question_id);
            const { correctText, selectedText, isCorrect } = getCorrectAnswerText(question, response.selected_option);
            
            return (
              <div key={response.$id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="mr-4 font-semibold text-gray-600">{index + 1}.</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg mb-2">
                        {question?.text || `Question ${question?.question_id || 'Unknown'}`}
                        {question?.difficulty && (
                          <span className="ml-2">{formatDifficulty(question.difficulty)}</span>
                        )}
                      </h3>
                      {question?.question_id && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          QID: {question.question_id}
                        </span>
                      )}
                    </div>

                    <div className="ml-4 space-y-2 mt-3">
                      {question?.options?.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`p-2 border rounded ${
                            optIndex === parseInt(response.selected_option) 
                              ? isCorrect 
                                ? 'border-green-500 bg-green-50' 
                                : 'border-red-500 bg-red-50'
                              : 'border-gray-200'
                          } ${
                            optIndex === question.correct_answer && !isCorrect 
                              ? 'border-green-500 bg-green-50' 
                              : ''
                          }`}
                        >
                          {optIndex + 1}. {option}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">Selected:</span> {response.selected_option + 1}
                        {selectedText && ` (${selectedText})`}
                      </div>
                      <div>
                        <span className="font-semibold">Correct:</span> {question?.correct_answer + 1 || 'N/A'}
                        {correctText && ` (${correctText})`}
                      </div>
                      <div className="col-span-2">
                        <span className="font-semibold">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentExamResponsesViewer;