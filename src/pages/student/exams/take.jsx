import React, { useState, useEffect, useCallback, useRef } from 'react';
import { databases, ID, Query } from '../../../utils/appwrite';
import { getCurrentStudentSession } from '../../../utils/auth';
import { useRouter } from 'next/router';
import { Clock, ChevronLeft, ChevronRight, Eye, Maximize2 } from 'lucide-react';

// Environment Variables
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const EXAMS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID;
const QUESTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID;
const EXAM_QUESTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXAM_QUESTIONS_COLLECTION_ID;
const RESPONSES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESPONSES_COLLECTION_ID;
const RESULTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESULTS_COLLECTION_ID;
const ENROLLMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID;
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_STUDENT_SESSIONS_COLLECTION_ID;
const ATTEMPTS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_EXAM_ATTEMPTS_COLLECTION_ID;

const TakeExam = () => {
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [examQuestionMappings, setExamQuestionMappings] = useState([]);
    const [answers, setAnswers] = useState({});
    const [markedForReview, setMarkedForReview] = useState({});
    const [responseDocs, setResponseDocs] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examStartTime, setExamStartTime] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [securityWarning, setSecurityWarning] = useState(null);
    const [violationCount, setViolationCount] = useState({
        tabSwitch: 0,
        fullscreenExit: 0,
        copyPaste: 0
    });
    const router = useRouter();
    const { examId } = router.query;

    const isSaving = useRef(false);
    const effectRan = useRef(false);

    const resolveRelationshipId = (field) => {
        if (!field) return null;
        if (Array.isArray(field) && field.length > 0) return field[0]?.$id || field[0];
        if (typeof field === 'object' && field.$id) return field.$id;
        return field;
    };

    // Security functions
    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            setViolationCount(prev => {
                const newCount = prev.tabSwitch + 1;
                updateAttemptViolations('tab_switch_count', newCount);
                return { ...prev, tabSwitch: newCount };
            });
            setSecurityWarning('Warning: Switching tabs is not allowed during the exam!');
            setTimeout(() => setSecurityWarning(null), 5000);
        }
    }, []);

    const enterFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .then(() => {
                    // Successfully entered fullscreen
                })
                .catch(err => {
                    console.error('Fullscreen error:', err);
                    setSecurityWarning('Please allow fullscreen mode for the best experience');
                    setTimeout(() => setSecurityWarning(null), 3000);
                });
        }
    }, []);

    const handleFullscreenChange = useCallback(() => {
        if (!document.fullscreenElement) {
            setViolationCount(prev => {
                const newCount = prev.fullscreenExit + 1;
                updateAttemptViolations('full_screen_exit_count', newCount);
                return { ...prev, fullscreenExit: newCount };
            });
            setSecurityWarning('Warning: Please remain in fullscreen mode during the exam!');
            setTimeout(() => setSecurityWarning(null), 5000);
        }
    }, []);

    const handleCopyPaste = useCallback((e) => {
        e.preventDefault();
        setViolationCount(prev => {
            const newCount = prev.copyPaste + 1;
            updateAttemptViolations('copy_paste_events', newCount);
            return { ...prev, copyPaste: newCount };
        });
        setSecurityWarning('Warning: Copy-paste is disabled during the exam!');
        setTimeout(() => setSecurityWarning(null), 3000);
        return false;
    }, []);

    const disableContextMenu = (e) => {
        e.preventDefault();
        return false;
    };

    const disableDevTools = useCallback((e) => {
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
        if (e.keyCode === 123 || // F12
            (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
            (e.ctrlKey && e.shiftKey && e.keyCode === 67)) { // Ctrl+Shift+C
            e.preventDefault();
            setSecurityWarning('Warning: Developer tools are disabled during the exam!');
            setTimeout(() => setSecurityWarning(null), 3000);
            return false;
        }
        // Disable right click
        if (e.button === 2) {
            e.preventDefault();
            return false;
        }
    }, []);

    const setupSecurity = useCallback(() => {
        // Event listeners for security
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('copy', handleCopyPaste);
        document.addEventListener('paste', handleCopyPaste);
        document.addEventListener('cut', handleCopyPaste);
        document.addEventListener('contextmenu', disableContextMenu);
        document.addEventListener('keydown', disableDevTools);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', handleCopyPaste);
            document.removeEventListener('paste', handleCopyPaste);
            document.removeEventListener('cut', handleCopyPaste);
            document.removeEventListener('contextmenu', disableContextMenu);
            document.removeEventListener('keydown', disableDevTools);
        };
    }, [handleVisibilityChange, handleFullscreenChange, handleCopyPaste, disableDevTools]);

    const updateAttemptViolations = async (field, value) => {
        if (!attemptId) return;
        try {
            await databases.updateDocument(DATABASE_ID, ATTEMPTS_COLLECTION_ID, attemptId, {
                [field]: value
            });
        } catch (err) {
            console.error('Failed to update violation count:', err);
        }
    };

    useEffect(() => {
        if (effectRan.current === false) {
            const fetchExamData = async () => {
                const session = getCurrentStudentSession();
                if (!session?.studentId) {
                    router.push('/login');
                    return;
                }
                setStudentInfo({ studentId: session.studentId, name: session.name });
                if (!examId) return;
                setLoading(true);
                setExamStartTime(new Date());

                try {
                    const examDoc = await databases.getDocument(DATABASE_ID, EXAMS_COLLECTION_ID, examId);
                    setExam(examDoc);
                    setTimeLeft(examDoc.duration * 60);

                    const existingAttempts = await databases.listDocuments(
                        DATABASE_ID, ATTEMPTS_COLLECTION_ID,
                        [Query.equal('students_id', [session.studentId]), Query.equal('exams_id', [examId]), Query.limit(1)]
                    );

                    if (existingAttempts.documents.length > 0) {
                        const existingAttempt = existingAttempts.documents[0];
                        setAttemptId(existingAttempt.$id);
                        setViolationCount({
                            tabSwitch: existingAttempt.tab_switch_count || 0,
                            fullscreenExit: existingAttempt.full_screen_exit_count || 0,
                            copyPaste: existingAttempt.copy_paste_events || 0
                        });
                        await databases.updateDocument(DATABASE_ID, ATTEMPTS_COLLECTION_ID, existingAttempt.$id, { 
                            status: 'in_progress', 
                            last_active_timestamp: new Date().toISOString() 
                        });
                    } else {
                        const attemptDoc = await databases.createDocument(DATABASE_ID, ATTEMPTS_COLLECTION_ID, ID.unique(), {
                            students_id: session.studentId, 
                            exams_id: examId, 
                            status: 'started', 
                            last_active_timestamp: new Date().toISOString(),
                            remaining_time: examDoc.duration * 60, 
                            tab_switch_count: 0, 
                            full_screen_exit_count: 0, 
                            copy_paste_events: 0,
                        });
                        setAttemptId(attemptDoc.$id);
                    }

                    const mappingsRes = await databases.listDocuments(DATABASE_ID, EXAM_QUESTIONS_COLLECTION_ID, [Query.limit(5000), Query.orderAsc('order')]);
                    const filteredMappings = mappingsRes.documents.filter(m => resolveRelationshipId(m.exam_id) === examId);
                    setExamQuestionMappings(filteredMappings);
                    
                    const questionIds = filteredMappings.map(m => resolveRelationshipId(m.question_id)).filter(Boolean);
                    if (questionIds.length > 0) {
                        const questionsRes = await databases.listDocuments(DATABASE_ID, QUESTIONS_COLLECTION_ID, [Query.equal('$id', questionIds)]);
                        const orderedQuestions = questionIds.map(id => questionsRes.documents.find(q => q.$id === id)).filter(Boolean);
                        setQuestions(orderedQuestions);

                        const prevResponsesRes = await databases.listDocuments(DATABASE_ID, RESPONSES_COLLECTION_ID, [
                            Query.equal('student_id', [session.studentId]), Query.equal('exam_id', [examId]), Query.limit(5000)
                        ]);

                        if (prevResponsesRes.documents.length > 0) {
                            const initialAnswers = {}, initialMarked = {}, initialResponseDocs = {};
                            prevResponsesRes.documents.forEach(res => {
                                const qId = resolveRelationshipId(res.question_id);
                                if (res.selected_option !== null) initialAnswers[qId] = res.selected_option;
                                initialMarked[qId] = res.marked_for_review;
                                initialResponseDocs[qId] = res.$id;
                            });
                            setAnswers(initialAnswers);
                            setMarkedForReview(initialMarked);
                            setResponseDocs(initialResponseDocs);
                        }
                    } else {
                        setQuestions([]);
                    }
                } catch (err) {
                    setError("Failed to load exam data.");
                    console.error("Fetch exam data error:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchExamData();
        }

        return () => {
            effectRan.current = true;
        };
    }, [examId, router]);

    useEffect(() => {
        if (!loading && exam) {
            const cleanup = setupSecurity();
            return cleanup;
        }
    }, [loading, exam, setupSecurity]);

    const saveResponse = useCallback(async (questionId, newAnswer, newMarkedStatus) => {
        if (isSaving.current || !studentInfo) return;
        isSaving.current = true;
        
        try {
            const responseDocId = responseDocs[questionId];
            const data = {
                student_id: studentInfo.studentId,
                exam_id: examId,
                question_id: questionId,
                marked_for_review: newMarkedStatus,
                selected_option: (newAnswer !== undefined && newAnswer !== null) ? newAnswer : null,
            };
            
            if (responseDocId) {
                await databases.updateDocument(DATABASE_ID, RESPONSES_COLLECTION_ID, responseDocId, data);
            } else {
                if (data.selected_option !== null || data.marked_for_review === true) {
                    const newDoc = await databases.createDocument(DATABASE_ID, RESPONSES_COLLECTION_ID, ID.unique(), { ...data, response_id: ID.unique() });
                    setResponseDocs(prev => ({...prev, [questionId]: newDoc.$id}));
                }
            }
        } catch (err) {
            console.error("Failed to save response:", err);
            if (err.code === 401) {
                setError("Permission Error: Cannot save answers. Please contact an administrator to check the 'responses' collection permissions.");
            }
        } finally {
            isSaving.current = false;
        }
    }, [responseDocs, studentInfo, examId]);

	const handleSubmit = useCallback(async (autoSubmit = false) => {
		if (!autoSubmit && !showSubmitConfirm) {
			setShowSubmitConfirm(true);
			return;
		}
		setIsSubmitting(true);
		setShowSubmitConfirm(false);
	
		try {
			const currentQuestionId = questions[currentQuestionIndex]?.$id;
			if (currentQuestionId) {
				await saveResponse(currentQuestionId, answers[currentQuestionId], markedForReview[currentQuestionId]);
			}
	
			let score = 0;
			let total_marks = 0;
	
			examQuestionMappings.forEach(mapping => {
				const questionId = resolveRelationshipId(mapping.question_id);
				const question = questions.find(q => q.$id === questionId);
				if (question) {
					total_marks += mapping.marks;
					if (answers[questionId] === question.correct_answer) {
						score += mapping.marks;
					}
				}
			});
	
			const percentage = total_marks > 0 ? (score / total_marks) * 100 : 0;
			const endTime = new Date();
			const time_taken = Math.round((endTime - examStartTime) / (1000 * 60));
	
			await databases.createDocument(DATABASE_ID, RESULTS_COLLECTION_ID, ID.unique(), {
				result_id: ID.unique(),
				student_id: studentInfo.studentId,
				exam_id: examId,
				score, total_marks, percentage,
				status: percentage >= 30 ? 'passed' : 'failed',
				time_taken,
				attempted_at: examStartTime.toISOString(),
				completed_at: endTime.toISOString(),
				created_at: endTime.toISOString()
			});
	
			const enrollmentsRes = await databases.listDocuments(DATABASE_ID, ENROLLMENTS_COLLECTION_ID, [Query.limit(5000)]);
			const studentEnrollment = enrollmentsRes.documents.find(enrollment =>
				resolveRelationshipId(enrollment.student_id) === studentInfo.studentId &&
				resolveRelationshipId(enrollment.exam_id) === examId
			);
	
			if (studentEnrollment) {
				await databases.updateDocument(DATABASE_ID, ENROLLMENTS_COLLECTION_ID, studentEnrollment.$id, { status: 'appeared' });
			}

			// =================================================================
			// FIXED CODE BLOCK: Ensure violation counts are saved on submit
			// =================================================================
			if (attemptId) {
				await databases.updateDocument(DATABASE_ID, ATTEMPTS_COLLECTION_ID, attemptId, { 
					status: 'submitted',
					tab_switch_count: violationCount.tabSwitch,
					full_screen_exit_count: violationCount.fullscreenExit,
					copy_paste_events: violationCount.copyPaste
				});
			}
			// =================================================================
			// END OF FIX
			// =================================================================
	
			alert("Exam submitted successfully!");
			router.push('/student');
	
		} catch (err) {
			setError("Failed to submit exam. Please contact support.");
			console.error("Submission error:", err);
			setIsSubmitting(false);
		}
	}, [questions, answers, studentInfo, examId, router, examQuestionMappings, examStartTime, showSubmitConfirm, saveResponse, currentQuestionIndex, attemptId, violationCount]);

    useEffect(() => {
        if (timeLeft === 0) handleSubmit(true);
        if (timeLeft === null) return;
        const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, handleSubmit]);
    
    const handleAnswerChange = (questionId, optionIndex) => {
        const newAnswers = { ...answers, [questionId]: optionIndex };
        setAnswers(newAnswers);
        const newMarkedStatus = { ...markedForReview, [questionId]: false };
        setMarkedForReview(newMarkedStatus);
        saveResponse(questionId, optionIndex, false);
    };

    const handleMarkForReview = (questionId) => {
        const newMarkedStatusValue = !markedForReview[questionId];
        setMarkedForReview(prev => ({ ...prev, [questionId]: newMarkedStatusValue }));
        saveResponse(questionId, answers[questionId], newMarkedStatusValue);
    };

    const handleNavigation = (newIndex) => {
        const oldQuestionId = questions[currentQuestionIndex]?.$id;
        if (oldQuestionId) {
            saveResponse(oldQuestionId, answers[oldQuestionId], markedForReview[oldQuestionId]);
        }
        setCurrentQuestionIndex(newIndex);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Exam...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!exam || questions.length === 0) return <div className="min-h-screen flex items-center justify-center">No questions found for this exam.</div>;

    const currentQuestion = questions[currentQuestionIndex];
    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {securityWarning && (
                <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 animate-bounce">
                    {securityWarning}
                </div>
            )}
            
            <header className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-20">
                <h1 className="text-xl font-bold">{exam.name}</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-mono text-lg">
                        <Clock size={20} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <button 
                        onClick={enterFullscreen}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                        <Maximize2 size={16} /> Fullscreen
                    </button>
                    <button 
                        onClick={() => handleSubmit(false)} 
                        disabled={isSubmitting} 
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 p-4 gap-4">
                <div className="flex-1 bg-white p-6 rounded-lg shadow-sm flex flex-col">
                    {currentQuestion && (
                        <div className="flex-1">
                            <p className="mb-2 text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                            <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>
                            <div className="space-y-3">
                                {currentQuestion.options_text.map((option, index) => (
                                    <label 
                                        key={index} 
                                        className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300"
                                    >
                                        <input 
                                            type="radio" 
                                            name={currentQuestion.$id} 
                                            checked={answers[currentQuestion.$id] === index} 
                                            onChange={() => handleAnswerChange(currentQuestion.$id, index)} 
                                            className="w-4 h-4 text-blue-600" 
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <button 
                            onClick={() => handleNavigation(Math.max(0, currentQuestionIndex - 1))} 
                            disabled={currentQuestionIndex === 0} 
                            className="flex items-center gap-2 px-4 py-2 rounded disabled:opacity-50 bg-gray-200 hover:bg-gray-300"
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <button 
                            onClick={() => handleMarkForReview(currentQuestion.$id)} 
                            className={`px-4 py-2 rounded flex items-center gap-2 ${markedForReview[currentQuestion.$id] ? 'bg-yellow-400' : 'bg-gray-200'}`}
                        >
                            <Eye size={20} /> {markedForReview[currentQuestion.$id] ? 'Unmark' : 'Mark for Review'}
                        </button>
                        <button 
                            onClick={() => handleNavigation(Math.min(questions.length - 1, currentQuestionIndex + 1))} 
                            disabled={currentQuestionIndex === questions.length - 1} 
                            className="flex items-center gap-2 px-4 py-2 rounded disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Next <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="w-72 bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold mb-4">Question Palette</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, index) => {
                            const isAnswered = answers[q.$id] !== undefined;
                            const isMarked = markedForReview[q.$id];
                            const isCurrent = index === currentQuestionIndex;
                            let color = 'bg-gray-200 hover:bg-gray-300';
                            if(isAnswered) color = 'bg-green-500 text-white';
                            if(isMarked) color = 'bg-yellow-400 text-white';
                            if(isCurrent) color = 'bg-blue-600 text-white ring-2 ring-blue-300';
                            return (
                                <button 
                                    key={q.$id} 
                                    onClick={() => handleNavigation(index)} 
                                    className={`w-10 h-10 rounded text-sm ${color}`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold mb-2">Legend:</h4>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 rounded bg-gray-200"></div>
                            <span>Unanswered</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 rounded bg-green-500"></div>
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-yellow-400"></div>
                            <span>Marked</span>
                        </div>
                    </div>
                </div>
            </div>

            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                        <h2 className="text-xl font-bold mb-2">Confirm Submission</h2>
                        <p className="mb-6">Are you sure you want to submit your exam?</p>
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => setShowSubmitConfirm(false)} 
                                className="px-6 py-2 rounded bg-gray-200 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleSubmit(false)} 
                                className="px-6 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeExam;