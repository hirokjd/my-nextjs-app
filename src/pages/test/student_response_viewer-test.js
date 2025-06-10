import { useState, useEffect } from 'react';
import { databases } from '../../utils/appwrite';
import { Query } from 'appwrite';

const StudentResponsesViewerPage = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const databaseId = '67a5a946002e8a51f8fe';
  const responsesCollectionId = 'responses';
  const questionsCollectionId = 'questions';
  const examsCollectionId = 'exams';
  const studentsCollectionId = 'students';

  const fetchExams = async () => {
    setLoading(true);
    try {
      console.log('Fetching exams...');
      const response = await databases.listDocuments(databaseId, examsCollectionId, [
        Query.limit(100),
        Query.orderDesc('exam_date')
      ]);
      console.log('Exams fetched:', response);
      setExams(response.documents);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      console.log('Fetching students...');
      const response = await databases.listDocuments(databaseId, studentsCollectionId, [
        Query.limit(100),
        Query.orderAsc('name')
      ]);
      console.log('Students fetched:', response);
      setStudents(response.documents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (examId, studentId) => {
    if (!examId || !studentId) return;
    
    setLoading(true);
    try {
      console.log(`Fetching responses for exam ${examId} and student ${studentId}...`);
      
      // First, get all responses for this student and exam
      const responsesResponse = await databases.listDocuments(
        databaseId, 
        responsesCollectionId,
        [
          Query.equal('exam_id', examId),
          Query.equal('student_id', studentId)
        ]
      );
      console.log('Responses fetched:', responsesResponse);
      
      setResponses(responsesResponse.documents);

      // Get all the questions referenced in these responses
      const questionIds = responsesResponse.documents.map(res => {
        const questionRef = res.question_id;
        if (Array.isArray(questionRef)) {
          return questionRef[0]?.$id || questionRef[0];
        } else if (typeof questionRef === 'object') {
          return questionRef.$id;
        }
        return questionRef;
      }).filter(id => id);

      console.log('Question IDs from responses:', questionIds);

      if (questionIds.length > 0) {
        console.log('Fetching questions for these IDs...');
        // Fetch all questions at once
        const questionsResponse = await databases.listDocuments(
          databaseId,
          questionsCollectionId,
          [Query.limit(100)]
        );
        console.log('Questions fetched:', questionsResponse);
        
        // Filter questions locally to match our questionIds
        const filteredQuestions = questionsResponse.documents.filter(q => 
          questionIds.includes(q.$id) || questionIds.includes(q.question_id)
        );
        console.log('Filtered questions:', filteredQuestions);
        setQuestions(filteredQuestions);
      } else {
        console.log('No question IDs found in responses');
        setQuestions([]);
      }
    } catch (err) {
      console.error('Error fetching responses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    console.log('Exam changed to:', examId);
    setSelectedExamId(examId);
    if (selectedStudentId) {
      fetchResponses(examId, selectedStudentId);
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    console.log('Student changed to:', studentId);
    setSelectedStudentId(studentId);
    if (selectedExamId) {
      fetchResponses(selectedExamId, studentId);
    }
  };

  const getQuestionById = (questionId) => {
    return questions.find(q => q.$id === questionId) || 
           questions.find(q => q.question_id === questionId);
  };

  const getResponseForQuestion = (questionId) => {
    return responses.find(res => {
      const qRef = res.question_id;
      const refId = Array.isArray(qRef) ? qRef[0]?.$id || qRef[0] : 
                   (typeof qRef === 'object' ? qRef.$id : qRef);
      return refId === questionId;
    });
  };

  const getOptionText = (question, optionIndex) => {
    if (!question) return '';
    if (question.options_text && question.options_text[optionIndex]) {
      return question.options_text[optionIndex];
    }
    return `Option ${optionIndex + 1}`;
  };

  useEffect(() => {
    console.log('Component mounted, fetching initial data...');
    fetchExams();
    fetchStudents();
  }, []);

  useEffect(() => {
    console.log('Responses updated:', responses);
    console.log('Questions updated:', questions);
  }, [responses, questions]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Student Responses Viewer</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
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
                  {exam.name} ({new Date(exam.exam_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={handleStudentChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
              disabled={loading}
            >
              <option value="">Choose a student</option>
              {students.map((student) => (
                <option key={student.$id} value={student.$id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedExamId && selectedStudentId && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Responses for {students.find(s => s.$id === selectedStudentId)?.name || 'Student'}
              </h2>
              <p className="text-sm text-gray-600">
                Exam: {exams.find(e => e.$id === selectedExamId)?.name || 'Selected Exam'}
              </p>
            </div>

            {loading && questions.length === 0 ? (
              <div className="text-center py-8">
                <p>Loading responses...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <p>No responses found for this student and exam</p>
                <div className="mt-4 text-left bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">Debug Information:</h3>
                  <p>Selected Exam ID: {selectedExamId}</p>
                  <p>Selected Student ID: {selectedStudentId}</p>
                  <p>Total responses found: {responses.length}</p>
                  <p>Total questions found: {questions.length}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question) => {
                  const response = getResponseForQuestion(question.$id);
                  const selectedOption = response?.selected_option;
                  const correctAnswer = question.correct_answer;
                  const isCorrect = selectedOption === correctAnswer;

                  return (
                    <div 
                      key={question.$id} 
                      className={`border rounded-lg p-4 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {question.text}
                          </h3>
                          
                          <div className="mt-3 space-y-2">
                            {[0, 1, 2, 3].map((index) => (
                              <div 
                                key={index}
                                className={`p-2 rounded border ${selectedOption === index ? 
                                  (isCorrect ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300') : 
                                  'bg-white border-gray-200'}`}
                              >
                                {getOptionText(question, index)}
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Selected: {selectedOption !== undefined ? selectedOption + 1 : 'Not answered'}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              Correct: {correctAnswer + 1}
                            </span>
                            {question.difficulty && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                                Difficulty: {question.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                            QID: {question.question_id || question.$id}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResponsesViewerPage;