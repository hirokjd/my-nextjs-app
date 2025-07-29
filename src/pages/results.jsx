import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { databases, Query } from '../utils/appwrite';
import { Home } from 'lucide-react';

const PublishedResultsPage = () => {
    const [groupedResults, setGroupedResults] = useState({});
    const [loadingResults, setLoadingResults] = useState(true);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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

                setGroupedResults(grouped);
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

    return (
        <>
            <Head>
                <title>Published Results - NIELIT Tezpur EC</title>
                <link rel="icon" href="https://mimitmalout.ac.in/NIELIT.png" />
            </Head>

            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <header className="w-full bg-white border-b border-gray-200 py-4 shadow-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img
                                src="https://mimitmalout.ac.in/NIELIT.png"
                                alt="NIELIT Tezpur EC Logo"
                                className="h-12 w-12"
                                onError={handleImageError}
                            />
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                Published Results
                            </h1>
                        </div>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <Home size={18} />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main className="py-8">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        {loadingResults ? (
                            <div className="text-center py-10">
                                <p className="text-lg text-gray-500">Loading results...</p>
                            </div>
                        ) : Object.keys(groupedResults).length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-lg shadow">
                                <p className="text-lg text-gray-600">No published results are available at the moment.</p>
                            </div>
                        ) : (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="space-y-10"
                            >
                                {Object.entries(groupedResults).map(([examName, results]) => (
                                    <motion.div key={examName} variants={itemVariants} className="bg-white p-6 rounded-lg shadow-md">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-4">{examName}</h3>
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sl no.</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {results.map((result, index) => (
                                                        <tr key={result.$id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.studentName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${result.score} / ${result.total_marks}`}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                    result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {result.status === 'passed' ? 'Passed' : 'Failed'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default PublishedResultsPage;