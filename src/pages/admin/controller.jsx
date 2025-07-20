import React, { useState, useEffect, useCallback } from 'react';
import { databases, ID, Query, account } from '../../utils/appwrite';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { lazy, Suspense } from 'react';

const Modal = lazy(() => import("../../components/Modal"));

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const CONTROLLERS_COLLECTION_ID = 'controllers';

const ManageControllersPage = () => {
    const [controllers, setControllers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingController, setEditingController] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [userNames, setUserNames] = useState({});

    const initialFormData = {
        Name: '',
        email: '',
        designation: '',
    };
    const [formData, setFormData] = useState(initialFormData);

    // Get current user on component mount
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const user = await account.get();
                setCurrentUser(user);
            } catch (err) {
                console.error("Failed to fetch current user:", err);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch user names for created_by fields
    const fetchUserNames = useCallback(async (userIds) => {
        try {
            const uniqueIds = [...new Set(userIds.filter(id => id))];
            const names = {};
            
            for (const userId of uniqueIds) {
                try {
                    const user = await account.get(userId);
                    names[userId] = user.name || user.email;
                } catch (err) {
                    console.error(`Failed to fetch user ${userId}:`, err);
                    names[userId] = 'Unknown User';
                }
            }
            
            setUserNames(names);
        } catch (err) {
            console.error("Error fetching user names:", err);
        }
    }, []);

    const fetchControllers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await databases.listDocuments(
                DATABASE_ID, 
                CONTROLLERS_COLLECTION_ID, 
                [Query.orderDesc("$createdAt")]
            );
            setControllers(response.documents);
            
            // Extract all unique created_by user IDs
            const userIds = response.documents.map(c => c.created_by).filter(Boolean);
            if (userIds.length > 0) {
                await fetchUserNames(userIds);
            }
        } catch (err) {
            setError("Failed to fetch controllers. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchUserNames]);

    useEffect(() => {
        fetchControllers();
    }, [fetchControllers]);

    const handleOpenModal = (controller = null) => {
        if (controller) {
            setEditingController(controller);
            setFormData({
                Name: controller.Name || '',
                email: controller.email,
                designation: controller.designation || '',
            });
        } else {
            setEditingController(null);
            setFormData(initialFormData);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingController(null);
        setFormData(initialFormData);
        setError(null);
    };

    const handleSave = async (data) => {
        if (!data.Name || !data.email) {
            setError("Name and email are required fields.");
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            if (editingController) {
                // Update existing controller
                await databases.updateDocument(
                    DATABASE_ID, 
                    CONTROLLERS_COLLECTION_ID, 
                    editingController.$id, 
                    {
                        Name: data.Name,
                        email: data.email,
                        designation: data.designation,
                    }
                );
            } else {
                // Create new controller
                await databases.createDocument(
                    DATABASE_ID, 
                    CONTROLLERS_COLLECTION_ID, 
                    ID.unique(), 
                    {
                        Name: data.Name,
                        email: data.email,
                        designation: data.designation,
                        created_by: currentUser?.$id // Automatically set current user as creator
                    }
                );
            }
            await fetchControllers();
            handleCloseModal();
        } catch (err) {
            setError(`Operation failed: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (controllerId) => {
        if (window.confirm("Are you sure you want to delete this controller?")) {
            setIsLoading(true);
            try {
                await databases.deleteDocument(
                    DATABASE_ID, 
                    CONTROLLERS_COLLECTION_ID, 
                    controllerId
                );
                await fetchControllers();
            } catch (err) {
                setError(`Failed to delete: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    return (
        <div className="w-full p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Controllers Management</h2>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Add Controller
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && controllers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                        Loading controllers...
                                    </td>
                                </tr>
                            ) : controllers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                        No controllers found
                                    </td>
                                </tr>
                            ) : (
                                controllers.map(controller => (
                                    <tr key={controller.$id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {controller.Name}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {controller.email}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {controller.designation || '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {controller.created_by ? (userNames[controller.created_by] || 'Loading...') : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(controller.$createdAt)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(controller)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(controller.$id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <Suspense fallback={<div className="p-4">Loading form...</div>}>
                        <Modal
                            title={editingController ? "Edit Controller" : "Create New Controller"}
                            onClose={handleCloseModal}
                            onSave={() => handleSave(formData)}
                            initialData={formData}
                            fields={[
                                { name: "Name", label: "Name", type: "text", required: true },
                                { name: "email", label: "Email", type: "email", required: true },
                                { name: "designation", label: "Designation", type: "text" },
                            ]}
                            onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                            isLoading={isLoading}
                            error={error}
                        />
                    </Suspense>
                )}
            </div>
        </div>
    );
};

export default ManageControllersPage;