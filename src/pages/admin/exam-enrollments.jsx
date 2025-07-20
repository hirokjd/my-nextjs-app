import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { databases } from "../../utils/appwrite"; // Assuming this path is correct
import { Plus, Edit, Trash2, Eye, Search, X, Download } from "lucide-react";
import { Query } from "appwrite";
import Modal from "../../components/Modal";
import { formatDateTimeUTC, formatDateUTC } from "../../utils/date";

// Custom Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Custom Message Dialog Component (for alerts)
const MessageDialog = ({ isOpen, title, message, onClose, closeText = "Close" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
                    >
                        {closeText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExamEnrollment = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [students, setStudents] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Modal States ---
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [messageDialogOpen, setMessageDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState({ title: "", message: "", onConfirm: () => {}, onCancel: () => {} });

    // --- Export State ---
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // --- Data States ---
    const [editingEnrollment, setEditingEnrollment] = useState(null);
    const [viewingEnrollment, setViewingEnrollment] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [selectedEnrollments, setSelectedEnrollments] = useState(new Set());
    const [selectedExamForBulk, setSelectedExamForBulk] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterExamId, setFilterExamId] = useState("");
    const [mainSearchTerm, setMainSearchTerm] = useState("");

    // --- Refs ---
    const modalRef = useRef(null);
    const viewModalRef = useRef(null);
    const bulkModalRef = useRef(null);
    const exportButtonRef = useRef(null);

    // --- Initial Form Data ---
    const initialFormData = {
        student_id: "",
        exam_id: "",
        enrolled_at: new Date().toISOString().slice(0, 16),
    };
    const [formData, setFormData] = useState(initialFormData);

    // --- Fetch Data on Mount ---
    useEffect(() => {
        fetchAllData();
    }, []);

    // --- Close Export Menu on Click Outside ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
                setIsExportMenuOpen(false);
            }
        };

        if (isExportMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isExportMenuOpen]);

    // --- Fetch All Data ---
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [enrollmentsResponse, studentsResponse, examsResponse] =
                await Promise.all([
                    databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                        [Query.orderDesc("$createdAt"), Query.limit(1000)]
                    ),
                    databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
                        [
                            Query.orderDesc("$createdAt"),
                            Query.limit(5000),
                        ]
                    ),
                    databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_EXAMS_COLLECTION_ID,
                        [Query.orderDesc("$createdAt"), Query.limit(1000)]
                    ),
                ]);

            const studentMap = new Map(
                studentsResponse.documents.map((student) => [
                    student.$id,
                    student,
                ])
            );
            const examMap = new Map(
                examsResponse.documents.map((exam) => [exam.$id, exam])
            );

            const normalizedEnrollments = enrollmentsResponse.documents.map(
                (enrollment) => {
                    let studentLookupKey = Array.isArray(enrollment.student_id)
                        ? enrollment.student_id[0]
                        : enrollment.student_id;

                    if (typeof studentLookupKey === 'object' && studentLookupKey !== null && studentLookupKey.$id) {
                        studentLookupKey = studentLookupKey.$id;
                    }
                    const student = studentMap.get(studentLookupKey);
                    if (!student && studentLookupKey) {
                        console.error(`Student NOT FOUND for ID: ${studentLookupKey} (Enrollment: ${enrollment.$id})`);
                    }

                    let examLookupKey = Array.isArray(enrollment.exam_id)
                        ? enrollment.exam_id[0]
                        : enrollment.exam_id;

                    if (typeof examLookupKey === 'object' && examLookupKey !== null && examLookupKey.$id) {
                        examLookupKey = examLookupKey.$id;
                    }
                    const exam = examMap.get(examLookupKey);
                    if (!exam && examLookupKey) {
                        console.error(`Exam NOT FOUND for ID: ${examLookupKey} (Enrollment: ${enrollment.$id})`);
                    }

                    const rawAppwriteStatus = enrollment.status; 
                    let appearance_status_display = "Not Appeared"; 
                    if (rawAppwriteStatus === 'appeared') {
                        appearance_status_display = "Appeared";
                    } else if (rawAppwriteStatus === 'not_appeared') {
                        appearance_status_display = "Not Appeared";
                    }
                    
                    return {
                        id: enrollment.$id,
                        enrollment_id: enrollment.enrollment_id, // Keep for other uses (export, view modal)
                        student_id: student?.$id || studentLookupKey || 'N/A',
                        student_name: student?.name || 'Unknown Student',
                        student_email: student?.email || '',
                        exam_id: exam?.$id || examLookupKey || 'N/A',
                        exam_name: exam?.name || 'Unknown Exam',
                        exam_description: exam?.description || '',
                        exam_date: exam?.exam_date ? formatDateUTC(exam.exam_date) : 'N/A',
                        enrolled_at: enrollment.enrolled_at ? formatDateTimeUTC(enrollment.enrolled_at) : 'N/A',
                        raw_enrolled_at: enrollment.enrolled_at,
                        appearance_status_display,
                        raw_appwrite_status: rawAppwriteStatus,
                    };
                }
            );

            setEnrollments(normalizedEnrollments);
            setStudents(studentsResponse.documents);
            setExams(examsResponse.documents);
            setSelectedEnrollments(new Set());
        } catch (error) {
            setError(error.message);
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Export to CSV ---
    const exportToCSV = async () => {
        try {
            const { Parser } = await import('json2csv');
            const fields = [
                { label: 'Enrollment ID', value: 'enrollment_id' },
                { label: 'Student Name', value: 'student_name' },
                { label: 'Student Email', value: 'student_email' },
                { label: 'Exam Name', value: 'exam_name' },
                { label: 'Exam Date', value: 'exam_date' },
                { label: 'Status', value: 'appearance_status_display' },
                { label: 'Enrolled At', value: 'enrolled_at' },
            ];
            const parser = new Parser({ fields });
            const csv = parser.parse(filteredEnrollments);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `enrollments_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            setDialogContent({
                title: "Export Error",
                message: `Failed to export to CSV: ${error.message}`,
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
        }
    };

    // --- Export to XLS ---
    const exportToXLS = async () => {
        try {
            const { utils, writeFile } = await import('xlsx');
            const data = filteredEnrollments.map(enrollment => ({
                'Enrollment ID': enrollment.enrollment_id,
                'Student Name': enrollment.student_name,
                'Student Email': enrollment.student_email,
                'Exam Name': enrollment.exam_name,
                'Exam Date': enrollment.exam_date,
                'Status': enrollment.appearance_status_display,
                'Enrolled At': enrollment.enrolled_at,
            }));
            const worksheet = utils.json_to_sheet(data);
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, worksheet, 'Enrollments');
            writeFile(workbook, `enrollments_${new Date().toISOString().slice(0, 10)}.xlsx`);
        } catch (error) {
            console.error('Error exporting to XLS:', error);
            setDialogContent({
                title: "Export Error",
                message: `Failed to export to XLS: ${error.message}`,
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
        }
    };
    
    const handleExport = (format) => {
        setIsExportMenuOpen(false);
        if (filteredEnrollments.length === 0) {
            setDialogContent({
                title: "No Data",
                message: "No enrollments available to export.",
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
            return;
        }
        if (format === 'csv') {
            exportToCSV();
        } else if (format === 'xls') {
            exportToXLS();
        }
    };

    const handleInputChange = (e, field) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const validateForm = () => {
        if (!formData.student_id || !formData.exam_id) {
            setDialogContent({
                title: "Validation Error",
                message: "Please select both a student and an exam.",
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
            return false;
        }
        return true;
    };

    const generateEnrollmentId = () => {
        return `enr_${Date.now().toString(36)}_${Math.random()
            .toString(36)
            .substring(2, 8)}`;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            const enrollmentData = {
                enrollment_id: editingEnrollment
                    ? editingEnrollment.enrollment_id
                    : generateEnrollmentId(),
                student_id: [formData.student_id],
                exam_id: [formData.exam_id],
                enrolled_at: formData.enrolled_at,
                status: editingEnrollment ? editingEnrollment.raw_appwrite_status : "not_appeared", 
            };

            if (editingEnrollment) {
                await databases.updateDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                    editingEnrollment.id,
                    enrollmentData
                );
            } else {
                await databases.createDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                    "unique()",
                    enrollmentData
                );
            }

            closeModal();
            fetchAllData();
        } catch (error) {
            console.error("Error saving enrollment:", error);
            setDialogContent({
                title: "Error",
                message: `Failed to save enrollment: ${error.message}`,
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
        }
    };

    const handleDelete = (id) => {
        setDialogContent({
            title: "Confirm Deletion",
            message: "Are you sure you want to delete this enrollment?",
            onConfirm: async () => {
                setConfirmDialogOpen(false);
                try {
                    await databases.deleteDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                        process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                        id
                    );
                    fetchAllData();
                } catch (error) {
                    console.error("Error deleting enrollment:", error.message);
                    setDialogContent({
                        title: "Error",
                        message: `Failed to delete enrollment: ${error.message}`,
                        onClose: () => setMessageDialogOpen(false)
                    });
                    setMessageDialogOpen(true);
                }
            },
            onCancel: () => setConfirmDialogOpen(false)
        });
        setConfirmDialogOpen(true);
    };

    const handleEdit = (enrollment) => {
        setEditingEnrollment(enrollment);
        setFormData({
            student_id: enrollment.student_id,
            exam_id: enrollment.exam_id,
            enrolled_at: enrollment.raw_enrolled_at
                ? formatDateTimeUTC(enrollment.raw_enrolled_at)
                    .slice(0, 16)
                : formatDateTimeUTC(new Date()).slice(0, 16),
        });
        setModalOpen(true);
    };

    const handleView = (enrollment) => {
        setViewingEnrollment(enrollment);
        setViewModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingEnrollment(null);
        setFormData(initialFormData);
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setViewingEnrollment(null);
    };

    const closeBulkModal = () => {
        setBulkModalOpen(false);
        setSelectedExamForBulk("");
        setSelectedStudents(new Set());
        setSearchTerm("");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                closeModal();
            }
            if (viewModalRef.current && !viewModalRef.current.contains(event.target)) {
                closeViewModal();
            }
            if (bulkModalRef.current && !bulkModalRef.current.contains(event.target)) {
                closeBulkModal();
            }
        };

        if (modalOpen || viewModalOpen || bulkModalOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [modalOpen, viewModalOpen, bulkModalOpen]);

    const handleStudentSelect = (studentId) => {
        setSelectedStudents((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(studentId)) {
                newSelected.delete(studentId);
            } else {
                newSelected.add(studentId);
            }
            return newSelected;
        });
    };

    const handleSelectAllStudents = (filteredStudentIds) => {
        const currentSelected = new Set(selectedStudents);
        const allFilteredSelected = filteredStudentIds.every(id => currentSelected.has(id));

        if (allFilteredSelected && filteredStudentIds.length > 0) {
            filteredStudentIds.forEach(id => currentSelected.delete(id));
        } else {
            filteredStudentIds.forEach(id => currentSelected.add(id));
        }
        setSelectedStudents(currentSelected);
    };

    const handleBulkSave = async () => {
        if (!selectedExamForBulk) {
            setDialogContent({
                title: "Selection Required",
                message: "Please select an exam.",
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
            return;
        }
        if (selectedStudents.size === 0) {
            setDialogContent({
                title: "Selection Required",
                message: "Please select at least one student.",
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
            return;
        }

        const enrolledAt = formatDateTimeUTC(new Date());
        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        const existingEnrollmentsForExam = enrollments.filter(
            (e) => e.exam_id === selectedExamForBulk
        );
        const enrolledStudentIds = new Set(
            existingEnrollmentsForExam.map((e) => e.student_id)
        );

        setLoading(true);

        const promises = [];

        selectedStudents.forEach((studentId) => {
            if (enrolledStudentIds.has(studentId)) {
                console.warn(`Student ${studentId} is already enrolled. Skipping.`);
                skippedCount++;
                return;
            }

            const enrollmentData = {
                enrollment_id: generateEnrollmentId(),
                student_id: [studentId],
                exam_id: [selectedExamForBulk],
                enrolled_at: enrolledAt,
                status: "not_appeared", // Default status for new bulk enrollments
            };

            promises.push(
                databases.createDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                    process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                    "unique()",
                    enrollmentData
                ).then(() => successCount++)
                .catch((err) => {
                    console.error(`Failed to enroll student ${studentId}:`, err);
                    failCount++;
                })
            );
        });

        try {
            await Promise.all(promises);
            let message = `Bulk enrollment complete! \n- ${successCount} successful\n- ${failCount} failed`;
            if (skippedCount > 0) {
                message += `\n- ${skippedCount} skipped (already enrolled)`;
            }
            setDialogContent({
                title: "Bulk Enrollment Result",
                message: message,
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
            closeBulkModal();
            fetchAllData();
        } catch (error) {
            console.error("An unexpected error occurred during bulk save:", error);
            setDialogContent({
                title: "Error",
                message: "An unexpected error occurred during bulk enrollment.",
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
        } 
        // setLoading will be set to false by fetchAllData
    };

    const handleSelectEnrollment = (enrollmentId) => {
        setSelectedEnrollments((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(enrollmentId)) {
                newSelected.delete(enrollmentId);
            } else {
                newSelected.add(enrollmentId);
            }
            return newSelected;
        });
    };

    const handleSelectAllEnrollments = () => {
        if (selectedEnrollments.size === filteredEnrollments.length && filteredEnrollments.length > 0) {
            setSelectedEnrollments(new Set());
        } else {
            const allIds = new Set(filteredEnrollments.map(e => e.id));
            setSelectedEnrollments(allIds);
        }
    };
    
    const handleBulkDelete = () => {
        if (selectedEnrollments.size === 0) {
            setDialogContent({
                title: "No Selection",
                message: "Please select at least one enrollment to delete.",
                onClose: () => setMessageDialogOpen(false)
            });
            setMessageDialogOpen(true);
            return;
        }

        setDialogContent({
            title: "Confirm Bulk Deletion",
            message: `Are you sure you want to delete ${selectedEnrollments.size} selected enrollments? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmDialogOpen(false);
                setLoading(true);
                let successCount = 0;
                let failCount = 0;
                const deletePromises = [];

                selectedEnrollments.forEach(id => {
                    deletePromises.push(
                        databases.deleteDocument(
                            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
                            process.env.NEXT_PUBLIC_APPWRITE_ENROLLMENTS_COLLECTION_ID,
                            id
                        ).then(() => successCount++)
                        .catch((err) => {
                            console.error(`Failed to delete enrollment ${id}:`, err);
                            failCount++;
                        })
                    );
                });

                try {
                    await Promise.all(deletePromises);
                    setDialogContent({
                        title: "Bulk Deletion Result",
                        message: `Bulk deletion complete! \n- ${successCount} successful\n- ${failCount} failed`,
                        onClose: () => setMessageDialogOpen(false)
                    });
                    setMessageDialogOpen(true);
                    fetchAllData();
                } catch (error) {
                    console.error("An unexpected error occurred during bulk deletion:", error);
                    setDialogContent({
                        title: "Error",
                        message: "An unexpected error occurred during bulk deletion.",
                        onClose: () => setMessageDialogOpen(false)
                    });
                    setMessageDialogOpen(true);
                }
                // setLoading will be set to false by fetchAllData
            },
            onCancel: () => setConfirmDialogOpen(false)
        });
        setConfirmDialogOpen(true);
    };

    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStudentIds = filteredStudents.map(student => student.$id);
    const allFilteredStudentsSelected = filteredStudents.length > 0 && filteredStudentIds.every(id => selectedStudents.has(id));

    const filteredEnrollments = enrollments.filter(enrollment => {
        const matchesExamFilter = filterExamId === "" || enrollment.exam_id === filterExamId;
        const matchesSearchTerm = mainSearchTerm === "" ||
            enrollment.student_name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
            enrollment.exam_name.toLowerCase().includes(mainSearchTerm.toLowerCase()) ||
            (enrollment.enrollment_id && enrollment.enrollment_id.toLowerCase().includes(mainSearchTerm.toLowerCase())); // Keep enrollment_id search capability
        return matchesExamFilter && matchesSearchTerm;
    });

    const allEnrollmentsSelected = filteredEnrollments.length > 0 && selectedEnrollments.size === filteredEnrollments.length;

    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "...";
    };

    const ActionButtons = ({ enrollment }) => (
        <div className="flex items-center gap-1 sm:gap-2">
            <button
                className="bg-gray-500 text-white p-1 rounded-md hover:bg-gray-600 transition-colors duration-200"
                onClick={() => handleView(enrollment)}
                title="View"
            >
                <Eye size={16} className="w-4 h-4" />
            </button>
            <button
                className="bg-yellow-500 text-white p-1 rounded-md hover:bg-yellow-600 transition-colors duration-200"
                onClick={() => handleEdit(enrollment)}
                title="Edit"
            >
                <Edit size={16} className="w-4 h-4" />
            </button>
            <button
                className="bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition-colors duration-200"
                onClick={() => handleDelete(enrollment.id)}
                title="Delete"
            >
                <Trash2 size={16} className="w-4 h-4" />
            </button>
        </div>
    );

    return (
        <div className="w-full">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Exam Enrollments</h2>
                    <div className="flex flex-wrap gap-2">
                        {selectedEnrollments.size > 0 && (
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 size={18} />
                                <span>Delete Selected ({selectedEnrollments.size})</span>
                            </button>
                        )}
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                            onClick={() => setBulkModalOpen(true)}
                        >
                            <Plus size={18} />
                            <span>Bulk Enroll</span>
                        </button>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                            onClick={() => { setEditingEnrollment(null); setFormData(initialFormData); setModalOpen(true);}}
                        >
                            <Plus size={18} />
                            <span>Add Single</span>
                        </button>
                        <div className="relative" ref={exportButtonRef}>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 text-base font-semibold shadow-sm"
                                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            >
                                <Download size={18} />
                                <span>Export</span>
                            </button>
                            {isExportMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleExport('csv')}
                                    >
                                        Export to CSV
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleExport('xls')}
                                    >
                                        Export to XLS
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label htmlFor="exam_filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filter by Exam:</label>
                    <select
                        id="exam_filter"
                        value={filterExamId}
                        onChange={(e) => setFilterExamId(e.target.value)}
                        className="mt-1 block w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50"
                    >
                        <option value="">All Exams</option>
                        {exams.map(exam => (
                            <option key={exam.$id} value={exam.$id}>
                                {exam.name} ({exam.exam_id})
                            </option>
                        ))}
                    </select>
                    {filterExamId && (
                        <button
                            onClick={() => setFilterExamId("")}
                            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 transition-colors duration-200 flex items-center gap-1 text-sm shadow-sm"
                        >
                            <X size={16} />
                            Clear Filter
                        </button>
                    )}

                    <div className="relative flex-grow sm:ml-4 w-full sm:w-auto">
                        <label htmlFor="main_search" className="sr-only">Search Enrollments</label>
                        <input
                            type="text"
                            id="main_search"
                            placeholder="Search by student, exam, or ID..."
                            value={mainSearchTerm}
                            onChange={(e) => setMainSearchTerm(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50 pl-10"
                        />
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-0.5" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-xl text-gray-600">Loading...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left">
                                        <input 
                                            type="checkbox" 
                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" 
                                            onChange={handleSelectAllEnrollments} 
                                            checked={allEnrollmentsSelected} 
                                            disabled={filteredEnrollments.length === 0}
                                        />
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:table-cell">Exam</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:table-cell">Exam Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled At</th>
                                    {/* Enrollment ID column header removed */}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEnrollments.length > 0 ? (
                                    filteredEnrollments.map((enrollment) => (
                                        <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    checked={selectedEnrollments.has(enrollment.id)}
                                                    onChange={() => handleSelectEnrollment(enrollment.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{enrollment.student_name}</div>
                                                {/* Small screen details for exam name and date */}
                                                <div className="text-xs text-gray-500 sm:hidden" title={enrollment.exam_name}>
                                                    {truncateText(enrollment.exam_name, 20)} ({enrollment.exam_date}) {/* Slightly shorter for mobile view */}
                                                </div>
                                                <div className="text-xs text-gray-500 sm:hidden">Status: {enrollment.appearance_status_display}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 sm:table-cell" title={enrollment.exam_name}>
                                                {truncateText(enrollment.exam_name, 25)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 sm:table-cell">{enrollment.exam_date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{enrollment.appearance_status_display}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{enrollment.enrolled_at}</td>
                                            {/* Enrollment ID column data removed */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <ActionButtons enrollment={enrollment} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        {/* Adjusted colSpan */}
                                        <td colSpan="7" className="text-center py-10 text-gray-500 text-lg">No enrollments found for the selected filter.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {modalOpen && (
                    <Modal
                        title={editingEnrollment ? "Edit Enrollment" : "Add Enrollment"}
                        onClose={closeModal}
                        onSave={handleSave}
                        initialData={formData}
                        fields={[
                            {
                                name: "student_id",
                                label: "Student",
                                type: "select",
                                required: true,
                                options: students.map(s => ({ value: s.$id, label: `${s.name} (${s.email})` })),
                                placeholder: "Select Student"
                            },
                            {
                                name: "exam_id",
                                label: "Exam",
                                type: "select",
                                required: true,
                                options: exams.map(e => ({ value: e.$id, label: e.name })),
                                placeholder: "Select Exam"
                            },
                            {
                                name: "enrolled_at",
                                label: "Enrollment Date",
                                type: "datetime-local",
                                required: true
                            }
                        ]}
                        isLoading={loading}
                        error={error}
                        onChange={e => {
                            const { name, value } = e.target;
                            setFormData(prev => ({ ...prev, [name]: value }));
                        }}
                    />
                )}
                
                {viewModalOpen && viewingEnrollment && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                        <div ref={viewModalRef} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl transform transition-all duration-300 scale-100 opacity-100">
                            <h3 className="text-2xl font-bold text-gray-800 mb-5">Enrollment Details</h3>
                            <div className="space-y-4 text-gray-700">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Student:</h4>
                                    <p className="ml-2">{viewingEnrollment.student_name} ({viewingEnrollment.student_email})</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Exam:</h4>
                                    <p className="ml-2">{viewingEnrollment.exam_name}</p>
                                    {viewingEnrollment.exam_description && (
                                        <p className="text-sm text-gray-600 ml-2">{viewingEnrollment.exam_description}</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Exam Date:</h4>
                                    <p className="ml-2">{viewingEnrollment.exam_date}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Appearance Status:</h4>
                                    <p className="ml-2">{viewingEnrollment.appearance_status_display}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Enrollment ID:</h4>
                                    <p className="ml-2">{viewingEnrollment.enrollment_id}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800">Enrolled At:</h4>
                                    <p className="ml-2">{viewingEnrollment.enrolled_at}</p>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button 
                                    onClick={closeViewModal} 
                                    className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {bulkModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                        <div ref={bulkModalRef} className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl h-[80vh] flex flex-col transform transition-all duration-300 scale-100 opacity-100">
                            <h3 className="text-2xl font-bold text-gray-800 mb-5">Bulk Enroll Students</h3>
                            <div className="mb-4">
                                <label htmlFor="bulk_exam_id" className="block text-sm font-semibold text-gray-700 mb-1">Select Exam</label>
                                <select 
                                    id="bulk_exam_id" 
                                    value={selectedExamForBulk} 
                                    onChange={(e) => setSelectedExamForBulk(e.target.value)} 
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 bg-gray-50" 
                                    required
                                >
                                    <option value="">Select Exam to Enroll In</option>
                                    {exams.map(exam => (
                                        <option key={exam.$id} value={exam.$id}>
                                            {exam.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4 relative">
                                <label htmlFor="student_search" className="block text-sm font-semibold text-gray-700 mb-1">Search Students</label>
                                <input
                                    type="text"
                                    id="student_search"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-gray-50 pl-10"
                                />
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 mt-2" />
                            </div>
                            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-4 shadow-inner">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" 
                                                    onChange={() => handleSelectAllStudents(filteredStudentIds)} 
                                                    checked={allFilteredStudentsSelected} 
                                                    disabled={filteredStudents.length === 0}
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.$id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                        checked={selectedStudents.has(student.$id)}
                                                        onChange={() => handleStudentSelect(student.$id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{student.email}</td>
                                            </tr>
                                        ))}
                                        {filteredStudents.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-6 text-gray-500 text-md">No students match your search.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-between items-center mt-auto pt-4">
                                <span className="text-sm text-gray-600 font-medium">{selectedStudents.size} student(s) selected</span>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={closeBulkModal} 
                                        className="bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 shadow-md"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleBulkSave} 
                                        className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md" 
                                        disabled={!selectedExamForBulk || selectedStudents.size === 0 || loading}
                                    >
                                        {loading ? 'Enrolling...' : `Enroll Selected (${selectedStudents.size})`}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <ConfirmationDialog
                    isOpen={confirmDialogOpen}
                    title={dialogContent.title}
                    message={dialogContent.message}
                    onConfirm={dialogContent.onConfirm}
                    onCancel={dialogContent.onCancel}
                />
                
                <MessageDialog
                    isOpen={messageDialogOpen}
                    title={dialogContent.title}
                    message={dialogContent.message}
                    onClose={dialogContent.onClose || (() => setMessageDialogOpen(false))}
                />
            </div>
        </div>
    );
};

export default ExamEnrollment;
