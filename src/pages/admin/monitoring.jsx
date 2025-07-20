import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { databases, Query } from '../../utils/appwrite';
import { Client } from 'appwrite'; // FIX: Import Client directly from the appwrite package
import { formatDateTimeUTC } from '../../utils/date';
import { Wifi, WifiOff, PlayCircle, LogOut, UserCheck, RefreshCw } from 'lucide-react';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '67a5a946002e8a51f8fe';
const STUDENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID || 'students';
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENT_SESSIONS_COLLECTION_ID || 'student_sessions';
const ATTEMPTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXAM_ATTEMPTS_COLLECTION_ID || 'exam_attempts';
const EXAMS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID || 'exams';

// New function to format dates in the user's local timezone.
const formatDateTimeLocal = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        // toLocaleString() automatically uses the user's browser timezone.
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (err) {
        console.error("Error formatting local date:", err);
        return "Invalid Date";
    }
};


const RealtimeMonitoringPage = () => {
    const [students, setStudents] = useState([]);
    const [sessions, setSessions] = useState(new Map());
    const [attempts, setAttempts] = useState(new Map());
    const [exams, setExams] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const resolveRelationshipId = (field) => {
        if (!field) return null;
        if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
        if (typeof field === 'object' && field.$id) return field.$id;
        return field;
    };

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const [studentsRes, sessionsRes, attemptsRes, examsRes] = await Promise.all([
                databases.listDocuments(DATABASE_ID, STUDENTS_COLLECTION_ID, [Query.limit(5000)]),
                databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [Query.limit(5000)]),
                databases.listDocuments(DATABASE_ID, ATTEMPTS_COLLECTION_ID, [Query.limit(5000)]),
                databases.listDocuments(DATABASE_ID, EXAMS_COLLECTION_ID, [Query.limit(5000)])
            ]);
            
            setStudents(studentsRes.documents);
            setExams(new Map(examsRes.documents.map(e => [e.$id, e])));
            
            const sessionsMap = new Map();
            sessionsRes.documents.forEach(s => {
                if(s.is_active) {
                    const studentId = resolveRelationshipId(s.students_id);
                    if(studentId) sessionsMap.set(studentId, s);
                }
            });
            setSessions(sessionsMap);

            const attemptsMap = new Map();
            attemptsRes.documents.forEach(a => {
                if(a.status === 'started' || a.status === 'in_progress') {
                    const studentId = resolveRelationshipId(a.students_id);
                    if(studentId) attemptsMap.set(studentId, a);
                }
            });
            setAttempts(attemptsMap);

        } catch (err) {
            console.error("Failed to fetch initial data:", err);
            setError("Could not load monitoring data. Please check collection permissions and environment variables.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

        const subscriptions = [];
        
        const collectionsToSubscribe = [
            SESSIONS_COLLECTION_ID,
            ATTEMPTS_COLLECTION_ID,
        ];

        collectionsToSubscribe.forEach(collectionId => {
            if (collectionId) { // Ensure collectionId is defined before subscribing
                const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${collectionId}.documents`, response => {
                    fetchData();
                });
                subscriptions.push(unsubscribe);
            }
        });

        return () => {
            subscriptions.forEach(unsubscribe => unsubscribe());
        };
    }, [fetchData]);

    const memoizedStudents = useMemo(() => {
        return students.map(student => {
            const session = sessions.get(student.$id);
            const attempt = attempts.get(student.$id);
            const exam = attempt ? exams.get(resolveRelationshipId(attempt.exams_id)) : null;
            return {
                ...student,
                session,
                attempt,
                exam,
            };
        }).sort((a, b) => {
            const aOnline = !!a.session;
            const bOnline = !!b.session;
            if (aOnline !== bOnline) return aOnline ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    }, [students, sessions, attempts, exams]);


    return (
        <div className="w-full">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-extrabold text-gray-800">Real-time Student Monitoring</h2>
                    <button onClick={() => { setLoading(true); fetchData(); }} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{error}</p></div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-200"><div className="flex items-center gap-4"><div className="p-3 bg-blue-200 rounded-full"><UserCheck className="w-6 h-6 text-blue-700" /></div><div><p className="text-3xl font-bold text-blue-800">{students.length}</p><p className="text-sm font-medium text-blue-600">Total Students</p></div></div></div>
                    <div className="bg-green-50 p-5 rounded-xl border border-green-200"><div className="flex items-center gap-4"><div className="p-3 bg-green-200 rounded-full"><Wifi className="w-6 h-6 text-green-700" /></div><div><p className="text-3xl font-bold text-green-800">{sessions.size}</p><p className="text-sm font-medium text-green-600">Students Online</p></div></div></div>
                    <div className="bg-orange-50 p-5 rounded-xl border border-orange-200"><div className="flex items-center gap-4"><div className="p-3 bg-orange-200 rounded-full"><PlayCircle className="w-6 h-6 text-orange-700" /></div><div><p className="text-3xl font-bold text-orange-800">{attempts.size}</p><p className="text-sm font-medium text-orange-600">Students In Exam</p></div></div></div>
                </div>

                <h3 className="text-xl font-bold text-gray-700 mb-4">Live Activity</h3>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && memoizedStudents.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-10 text-gray-500">Loading student data...</td></tr>
                            ) : memoizedStudents.map(student => (
                                <tr key={student.$id} className={student.session ? 'bg-green-50' : 'bg-white'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.session ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><Wifi size={14} /> Online</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700"><WifiOff size={14} /> Offline</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.attempt && student.exam ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800"><PlayCircle size={14} /> In Exam: {student.exam.name}</span>
                                        ) : student.session ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"><UserCheck size={14} /> Idle</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700"><LogOut size={14} /> Not Logged In</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {student.session ? formatDateTimeLocal(student.session.login_at) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {student.session ? student.session.ip_address : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RealtimeMonitoringPage;
