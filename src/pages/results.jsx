import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { databases, Query } from '../utils/appwrite';
import { Home, Award, CheckCircle, XCircle, Calendar, Users, ArrowLeft, Eye, Clock, History } from 'lucide-react';

const PublishedResultsPage = () => {
    const [groupedResults, setGroupedResults] = useState({});
    const [loadingResults, setLoadingResults] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);
    const [recentExams, setRecentExams] = useState([]);
    const [previousExams, setPreviousExams] = useState([]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    useEffect(() => {
        const fetchPublishedResults = async () => {
            try {
                // Fetch results, students, and exams in parallel
                const resultsPromise = databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID,
                    [Query.equal('publish', true), Query.orderDesc('$createdAt')]
                );
                const studentsPromise = databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
                    [Query.limit(5000)]
                );
                const examsPromise = databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
                    [Query.limit(1000)]
                );

                const [resultsResponse, studentsResponse, examsResponse] = await Promise.all([resultsPromise, studentsPromise, examsPromise]);

                if (resultsResponse.documents.length === 0) {
                    setGroupedResults({});
                    setRecentExams([]);
                    setPreviousExams([]);
                    return;
                }

                // Create maps for efficient lookups
                const studentMap = new Map(studentsResponse.documents.map(s => [s.$id, s]));
                const examMap = new Map(examsResponse.documents.map(e => [e.$id, e]));

                // Enrich results with student and exam names
                const enrichedResults = resultsResponse.documents.map(result => {
                    const studentId = resolveRelationshipId(result.student_id);
                    const examId = resolveRelationshipId(result.exam_id);
                    return {
                        ...result,
                        studentName: studentMap.get(studentId)?.name || 'Unknown Student',
                        examName: examMap.get(examId)?.name || 'Unknown Exam',
                        publishedDate: new Date(result.$createdAt),
                    };
                });

                // Group the enriched results by exam name
                const grouped = enrichedResults.reduce((acc, result) => {
                    const examName = result.examName;
                    if (!acc[examName]) {
                        acc[examName] = [];
                    }
                    acc[examName].push(result);
                    return acc;
                }, {});

                // Create exam list with dates and categorize by recency
                const now = new Date();
                const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

                const examListData = Object.entries(grouped).map(([examName, results]) => {
                    const passed = results.filter(r => r.status === 'passed').length;
                    const passRate = ((passed / results.length) * 100).toFixed(1);
                    const latestDate = new Date(Math.max(...results.map(r => r.publishedDate.getTime())));
                    
                    return {
                        name: examName,
                        totalStudents: results.length,
                        passed,
                        failed: results.length - passed,
                        passRate,
                        results,
                        publishedDate: latestDate,
                        isRecent: latestDate >= oneMonthAgo
                    };
                });

                // Sort by date (most recent first) and separate into recent and previous
                const sortedExams = examListData.sort((a, b) => b.publishedDate - a.publishedDate);
                const recent = sortedExams.filter(exam => exam.isRecent);
                const previous = sortedExams.filter(exam => !exam.isRecent);

                setGroupedResults(grouped);
                setRecentExams(recent);
                setPreviousExams(previous);
            } catch (error) {
                console.error("Failed to fetch published results:", error);
            } finally {
                setLoadingResults(false);
            }
        };

        const resolveRelationshipId = (field) => {
            if (!field) return null;
            if (typeof field === "object" && field.$id) return field.$id;
            if (Array.isArray(field) && field.length > 0) {
                const id = field[0]?.$id || field[0];
                return id;
            }
            return field;
        };

        fetchPublishedResults();
    }, []);

    const handleImageError = (e) => {
        e.target.src = '/fallback-logo.png';
        e.target.alt = 'NIELIT Tezpur EC Fallback Logo';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleExamClick = (exam) => {
        setSelectedExam(exam);
    };

    const handleBackToList = () => {
        setSelectedExam(null);
    };

    // Render exam details
    const renderExamDetails = () => {
        if (!selectedExam) return null;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                {/* Back Button */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleBackToList}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Exam List</span>
                    </button>
                </div>

                {/* Exam Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold">{selectedExam.name}</h3>
                                <p className="text-blue-100 text-sm mt-1">
                                    {selectedExam.totalStudents} students • {selectedExam.passRate}% pass rate
                                </p>
                                <p className="text-blue-100 text-xs mt-1">
                                    Published: {formatDate(selectedExam.publishedDate)}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="bg-blue-500 rounded-full px-3 py-1 text-xs font-medium">
                                    Results Published
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {selectedExam.results
                                    .sort((a, b) => b.score - a.score)
                                    .map((result, index) => (
                                    <tr key={result.$id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-50 text-gray-600'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {result.studentName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="font-semibold">{result.score}</span>
                                            <span className="text-gray-400"> / {result.total_marks}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                result.status === 'passed' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {result.status === 'passed' ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        PASSED
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        FAILED
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Render exam list
    const renderExamList = () => {
        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                {/* Notice */}
                <motion.div variants={itemVariants} className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                        <div className="bg-yellow-100 rounded-full p-2">
                            <Award className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-yellow-800 mb-1">Important Notice</h3>
                            <p className="text-yellow-700 text-sm">
                                These results are published for public viewing. Students are advised to verify their results and contact the administration for any discrepancies.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Results Section */}
                {recentExams.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-green-100 rounded-full p-2">
                                <Clock className="h-5 w-5 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Recent Results</h2>
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                Last 30 Days
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentExams.map((exam) => (
                                <motion.div
                                    key={exam.name}
                                    variants={itemVariants}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative"
                                    onClick={() => handleExamClick(exam)}
                                >
                                    {/* New Badge */}
                                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        NEW
                                    </div>
                                    
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                                            <div className="bg-blue-100 rounded-full p-2">
                                                <Eye className="h-4 w-4 text-blue-600" />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total Students:</span>
                                                <span className="font-medium">{exam.totalStudents}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Passed:</span>
                                                <span className="font-medium text-green-600">{exam.passed}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Failed:</span>
                                                <span className="font-medium text-red-600">{exam.failed}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Pass Rate:</span>
                                                <span className="font-medium text-blue-600">{exam.passRate}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Published:</span>
                                                <span className="font-medium text-gray-500">{formatDate(exam.publishedDate)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                                                View Results
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Previous Results Section */}
                {previousExams.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 rounded-full p-2">
                                <History className="h-5 w-5 text-gray-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Previous Results</h2>
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                                Older Results
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {previousExams.map((exam) => (
                                <motion.div
                                    key={exam.name}
                                    variants={itemVariants}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleExamClick(exam)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                                            <div className="bg-gray-100 rounded-full p-2">
                                                <Eye className="h-4 w-4 text-gray-600" />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total Students:</span>
                                                <span className="font-medium">{exam.totalStudents}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Passed:</span>
                                                <span className="font-medium text-green-600">{exam.passed}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Failed:</span>
                                                <span className="font-medium text-red-600">{exam.failed}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Pass Rate:</span>
                                                <span className="font-medium text-blue-600">{exam.passRate}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Published:</span>
                                                <span className="font-medium text-gray-500">{formatDate(exam.publishedDate)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                                View Results
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Footer Notice */}
                <motion.div variants={itemVariants} className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600 text-sm">
                        <strong>Disclaimer:</strong> These results are published for public information. 
                        For official verification, please contact the NIELIT Tezpur EC administration.
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                        Last updated: {formatDate(new Date())} • NIELIT Tezpur EC
                    </p>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <>
            <Head>
                <title>Exam Results - NIELIT Tezpur EC</title>
                <meta name="description" content="Published exam results from NIELIT Tezpur EC" />
                <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
                {/* Header */}
                <header className="w-full bg-white border-b border-gray-200 py-6 shadow-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <img
                                    src="https://mimitmalout.ac.in/NIELIT.png"
                                    alt="NIELIT Tezpur EC Logo"
                                    className="h-12 w-12"
                                    onError={handleImageError}
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">NIELIT Tezpur EC</h1>
                                    <p className="text-gray-600">Online Exam System</p>
                                </div>
                            </div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                <Home size={18} />
                                <span>Home</span>
                            </Link>
                        </div>
                        
                        {/* Public Notice Header */}
                        <div className="text-center py-6 bg-blue-600 text-white rounded-lg">
                            <Award className="mx-auto h-12 w-12 mb-4" />
                            <h2 className="text-3xl font-bold mb-2">EXAM RESULTS</h2>
                            <p className="text-blue-100">Published Results - Available for Public Viewing</p>
                            <div className="flex items-center justify-center mt-4 space-x-6 text-sm">
                                <div className="flex items-center space-x-2">
                                    <Calendar size={16} />
                                    <span>Published: {formatDate(new Date())}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Users size={16} />
                                    <span>Public Notice</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="py-8">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        {loadingResults ? (
                            <div className="text-center py-16">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-lg text-gray-600">Loading results...</p>
                            </div>
                        ) : recentExams.length === 0 && previousExams.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                                <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Published</h3>
                                <p className="text-gray-600">No exam results have been published yet.</p>
                                <p className="text-sm text-gray-500 mt-2">Please check back later for updates.</p>
                            </div>
                        ) : selectedExam ? (
                            renderExamDetails()
                        ) : (
                            renderExamList()
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default PublishedResultsPage;