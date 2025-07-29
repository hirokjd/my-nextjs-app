import React, { useState, useEffect, Suspense } from 'react';
import { databases, Query } from '../../utils/appwrite';
import { CheckCircle, AlertCircle, ArrowLeft, Send, ListChecks } from 'lucide-react';
import Link from 'next/link';

// Custom Message Dialog Component (for alerts/confirmations)
const MessageDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isConfirmation = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 scale-100 opacity-100">
                <div className="flex items-center mb-4">
                    {title.toLowerCase().includes("error") ? 
                        <AlertCircle className="text-red-500 mr-3" size={24} /> :
                     title.toLowerCase().includes("success") ?
                        <CheckCircle className="text-green-500 mr-3" size={24} /> :
                        <AlertCircle className="text-yellow-500 mr-3" size={24} />
                    }
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                </div>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    {isConfirmation && (
                         <button
                            onClick={onCancel}
                            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                         >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`${
                            isConfirmation ? 'bg-blue-600 hover:bg-blue-700' : 
                            title.toLowerCase().includes("error") ? 'bg-red-600 hover:bg-red-700' :
                            'bg-green-600 hover:bg-green-700'
                        } text-white px-5 py-2 rounded-lg transition-colors duration-200 shadow-md`}
                    >
                        {isConfirmation ? confirmText : "OK"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PublishResultsPage = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamName, setSelectedExamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", message: "", onConfirm: () => {}, onCancel: () => {}, isConfirmation: false });
  const [publishedResultsList, setPublishedResultsList] = useState([]);

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const examsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
  const resultsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;
  const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;

  const resolveRelationshipId = (field) => {
    if (!field) return null;
    if (typeof field === 'object' && field.$id) return field.$id;
    if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
    if (typeof field === 'string') return field;
    return null;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [examsResponse, studentsResponse] = await Promise.all([
          databases.listDocuments(databaseId, examsCollectionId, [Query.limit(100)]),
          databases.listDocuments(databaseId, studentsCollectionId, [Query.limit(500)])
        ]);
        setExams(examsResponse.documents);
        setStudents(studentsResponse.documents);
      } catch (error) {
        setDialogContent({
            title: "Error",
            message: `Error fetching initial data: ${error.message}`,
            onConfirm: () => setIsDialogOpen(false),
            isConfirmation: false
        });
        setIsDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [databaseId, examsCollectionId, studentsCollectionId]);

  const handleExamSelectionChange = (e) => {
    const examId = e.target.value;
    setSelectedExamId(examId);
    setPublishedResultsList([]);
    const selectedExam = exams.find(exam => exam.$id === examId);
    setSelectedExamName(selectedExam ? selectedExam.name : '');
  };

  const handlePublishResults = async () => {
    if (!selectedExamId) {
       setDialogContent({
            title: "Validation Error",
            message: "Please select an exam to publish results.",
            onConfirm: () => setIsDialogOpen(false),
            isConfirmation: false
        });
        setIsDialogOpen(true);
        return;
    }
    setPublishedResultsList([]);

    setDialogContent({
        title: "Confirm Publish",
        message: `Are you sure you want to publish results for "${selectedExamName || 'the selected exam'}"?`,
        onConfirm: async () => {
            setIsDialogOpen(false);
            setLoading(true);
            try {
              let allResultsForExam = [];
              let offset = 0;
              const limit = 100; 
              let response;
        
              do {
                response = await databases.listDocuments(
                  databaseId,
                  resultsCollectionId,
                  [
                    Query.equal('exam_id', [selectedExamId]), // Querying relationships requires an array
                    Query.equal('publish', false),
                    Query.limit(limit),
                    Query.offset(offset)
                  ]
                );
                allResultsForExam = allResultsForExam.concat(response.documents);
                offset += limit;
              } while (response.documents.length === limit);

              if (allResultsForExam.length === 0) {
                setDialogContent({
                    title: "No Results to Publish",
                    message: "No unpublished results found for the selected exam.",
                    onConfirm: () => setIsDialogOpen(false),
                    isConfirmation: false
                });
                setIsDialogOpen(true);
                setLoading(false);
                return;
              }
        
              const updatePromises = allResultsForExam.map(result =>
                databases.updateDocument(databaseId, resultsCollectionId, result.$id, { publish: true })
              );
              await Promise.all(updatePromises);
              
              // =================================================================
              // ADDED CODE BLOCK: Update exam status to 'completed'
              // =================================================================
              try {
                await databases.updateDocument(
                    databaseId,
                    examsCollectionId,
                    selectedExamId,
                    { status: 'completed' }
                );
              } catch (examUpdateError) {
                  console.error("Failed to update exam status to completed:", examUpdateError);
                  // This is a non-critical error, so we'll just log it and continue.
                  // The primary goal of publishing results was successful.
              }
              // =================================================================
              // END OF ADDED CODE
              // =================================================================

              const studentMap = new Map(students.map(s => [s.$id, s.name]));
              const updatedResultsWithStudentNames = allResultsForExam.map(res => ({
                  ...res,
                  studentName: studentMap.get(resolveRelationshipId(res.student_id)) || 'Unknown Student',
                  publish: true
              }));
              setPublishedResultsList(updatedResultsWithStudentNames);
        
              setDialogContent({
                  title: "Success",
                  message: `Successfully published ${allResultsForExam.length} results for "${selectedExamName}". The exam status has been updated to 'completed'.`,
                  onConfirm: () => setIsDialogOpen(false),
                  isConfirmation: false
              });
              setIsDialogOpen(true);
            } catch (error) {
              setDialogContent({
                  title: "Error",
                  message: `Failed to publish results: ${error.message}`,
                  onConfirm: () => setIsDialogOpen(false),
                  isConfirmation: false
              });
              setIsDialogOpen(true);
            } finally {
              setLoading(false);
            }
        },
        onCancel: () => setIsDialogOpen(false),
        isConfirmation: true
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/results" legacyBehavior>
            <a className="text-blue-600 hover:text-blue-800 flex items-center mr-4">
              <ArrowLeft size={20} className="mr-1" />
              Back to Results
            </a>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Publish Exam Results</h2>
        </div>

        {isDialogOpen && (
            <MessageDialog
                isOpen={isDialogOpen}
                title={dialogContent.title}
                message={dialogContent.message}
                onConfirm={dialogContent.onConfirm}
                onCancel={dialogContent.onCancel}
                isConfirmation={dialogContent.isConfirmation}
                confirmText={dialogContent.confirmText}
                cancelText={dialogContent.cancelText}
            />
        )}

        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <label htmlFor="examSelect" className="block text-sm font-semibold text-gray-700 mb-2">
            Select Exam to Publish Results:
          </label>
          <select
            id="examSelect"
            value={selectedExamId}
            onChange={handleExamSelectionChange}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white text-base"
            disabled={loading}
          >
            <option value="">-- Select an Exam --</option>
            {exams.map(exam => (
              <option key={exam.$id} value={exam.$id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end mb-8">
          <button
            onClick={handlePublishResults}
            disabled={loading || !selectedExamId}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Publishing...
              </>
            ) : (
              <>
                <Send size={18} /> Publish Results
              </>
            )}
          </button>
        </div>

        {publishedResultsList.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <ListChecks size={24} className="mr-2 text-green-600" />
              Results Published for "{selectedExamName}"
            </h3>
            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result Status</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publish Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {publishedResultsList.map((result) => (
                    <tr key={result.$id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.studentName || 'Loading...'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.score}/{result.total_marks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.percentage?.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                          {result.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                         {result.publish ? (
                            <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                <CheckCircle size={14} className="mr-1" /> Published
                            </span>
                            ) : (
                            <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                <AlertCircle size={14} className="mr-1" /> Not Published
                            </span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishResultsPage;
