import React, { useState, useEffect, useCallback } from 'react';
import { databases, Query } from '../../utils/appwrite';
import { Users, Printer, Loader2, Mail, Check, AlertTriangle } from 'lucide-react';

const ExamStudentsPage = () => {
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [sendingEmails, setSendingEmails] = useState(false);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState({ type: '', message: '' });

    const fetchExams = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
                [Query.orderDesc('$createdAt'), Query.limit(1000)]
            );
            setExams(response.documents);
        } catch (err) {
            console.error('Failed to fetch exams:', err);
            setError('Could not load exams. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    useEffect(() => {
        if (!selectedExamId) {
            setEnrolledStudents([]);
            setSelectedStudents(new Set());
            return;
        }

        const fetchEnrolledStudents = async () => {
            setLoading(true);
            setError('');
            setEnrolledStudents([]);
            setSelectedStudents(new Set());

            try {
                const enrollmentsPromise = databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                    [Query.limit(5000)]
                );
                const studentsPromise = databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
                    [Query.limit(5000)]
                );

                const [enrollmentsResponse, studentsResponse] = await Promise.all([enrollmentsPromise, studentsPromise]);
                const studentMap = new Map(studentsResponse.documents.map(s => [s.$id, s]));
                const filteredEnrollments = enrollmentsResponse.documents.filter(enrollment => {
                    const examRef = enrollment.exam_id;
                    if (Array.isArray(examRef)) return examRef.some(ref => ref.$id === selectedExamId);
                    return examRef?.$id === selectedExamId;
                });

                const studentsForExam = filteredEnrollments.map(enrollment => {
                    const studentRef = enrollment.student_id;
                    const studentId = Array.isArray(studentRef) ? studentRef[0]?.$id : studentRef?.$id;
                    return studentMap.get(studentId);
                }).filter(Boolean);

                setEnrolledStudents(studentsForExam);
            } catch (err) {
                console.error('Failed to fetch enrolled students:', err);
                setError('Could not load student data for the selected exam.');
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolledStudents();
    }, [selectedExamId]);

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allStudentIds = new Set(enrolledStudents.map(s => s.$id));
            setSelectedStudents(allStudentIds);
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handleSendCredentials = async () => {
        if (selectedStudents.size === 0) {
            setNotification({ type: 'error', message: 'Please select at least one student.' });
            return;
        }

        setSendingEmails(true);
        setNotification({ type: '', message: '' });

        const studentsToSend = enrolledStudents.filter(s => selectedStudents.has(s.$id));
        const examName = exams.find(e => e.$id === selectedExamId)?.name || 'the upcoming exam';

        try {
            const response = await fetch('/api/send-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students: studentsToSend, examName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'An unknown error occurred.');
            }

            setNotification({ type: 'success', message: `Successfully sent credentials to ${studentsToSend.length} student(s).` });
            setSelectedStudents(new Set());
        } catch (err) {
            console.error('Failed to send credentials:', err);
            setNotification({ type: 'error', message: `Failed to send emails: ${err.message}` });
        } finally {
            setSendingEmails(false);
        }
    };
    
    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => setNotification({ type: '', message: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
            <div className="container mx-auto bg-white rounded-lg shadow-md p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 print:hidden">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center">
                        <Users className="mr-3 text-blue-600" />
                        Enrolled Students Viewer
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleSendCredentials}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                            disabled={sendingEmails || enrolledStudents.length === 0 || selectedStudents.size === 0}
                        >
                            {sendingEmails ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                            <span>Send Credentials ({selectedStudents.size})</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                            disabled={enrolledStudents.length === 0}
                        >
                            <Printer size={18} />
                            Print List
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {notification.message && (
                    <div className={`p-4 mb-4 rounded-md flex items-center gap-3 text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                        {notification.message}
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                {/* Exam Selector */}
                <div className="mb-6 print:hidden">
                    <label htmlFor="exam_selector" className="block text-sm font-medium text-gray-700 mb-1">Select an Exam</label>
                    <select
                        id="exam_selector"
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="mt-1 block w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
                        disabled={loading}
                    >
                        <option value="">-- Choose an Exam --</option>
                        {exams.map(exam => <option key={exam.$id} value={exam.$id}>{exam.name} ({exam.exam_id})</option>)}
                    </select>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                        <p className="ml-3 text-lg text-gray-600">Loading Students...</p>
                    </div>
                )}

                {/* Students Table */}
                {!loading && selectedExamId && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-700 mb-4">Students for: {exams.find(e => e.$id === selectedExamId)?.name}</h3>
                        {enrolledStudents.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left print:hidden">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    onChange={handleSelectAll}
                                                    checked={enrolledStudents.length > 0 && selectedStudents.size === enrolledStudents.length}
                                                />
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sl. No.</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email ID</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {enrolledStudents.map((student, index) => (
                                            <tr key={student.$id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap print:hidden">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                        checked={selectedStudents.has(student.$id)}
                                                        onChange={() => handleSelectStudent(student.$id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{student.password}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500 text-lg">No students are enrolled in this exam.</div>
                        )}
                    </div>
                )}
            </div>
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .container, .container * { visibility: visible; }
                    .container { position: absolute; left: 0; top: 0; width: 100%; }
                    .print\\:hidden { display: none; }
                }
            `}</style>
        </div>
    );
};

export default ExamStudentsPage;