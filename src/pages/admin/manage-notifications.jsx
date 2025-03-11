"use client";

import { useState } from "react";
import { Bell, Info, AlertCircle, CheckCircle, XCircle, Plus, Edit } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/router"; // Import useRouter from next/router

const initialNotifications = [
  { id: 1, type: "info", title: "New Exam Schedule", message: "Mathematics final exam has been scheduled for next week.", time: "2 hours ago" },
  { id: 2, type: "warning", title: "System Maintenance", message: "The system will be under maintenance on Sunday, 2 AM - 4 AM.", time: "1 day ago" },
  { id: 3, type: "success", title: "Results Published", message: "Physics mid-term exam results have been published.", time: "2 days ago" },
  { id: 4, type: "error", title: "Payment Failed", message: "Your exam registration payment was unsuccessful.", time: "3 days ago" },
];

const ManageNotifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);

  const router = useRouter(); // Initialize router

  const icons = {
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertCircle className="text-amber-500" size={20} />,
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
  };

  const badgeColors = {
    info: "bg-blue-100 text-blue-600",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-emerald-100 text-emerald-600",
    error: "bg-red-100 text-red-600",
  };

  const markAllAsRead = () => setNotifications([]);

  const removeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const addNotification = () => {
    setIsEditing(true);
    setCurrentNotification({ id: notifications.length + 1, type: "info", title: "", message: "", time: "Just now" });
  };

  const editNotification = (notification) => {
    setIsEditing(true);
    setCurrentNotification(notification);
  };

  const saveNotification = () => {
    setNotifications((prev) =>
      currentNotification.id > prev.length
        ? [currentNotification, ...prev]
        : prev.map((n) => (n.id === currentNotification.id ? currentNotification : n))
    );
    setIsEditing(false);
    setCurrentNotification(null);
  };

  return (
    <div className="p-6">
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-800">Manage Notifications</h1>
        <div className="flex gap-4">
          <motion.button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            onClick={addNotification}
            whileHover={{ scale: 1.05 }}
          >
            <Plus size={20} />
            Add Notification
          </motion.button>
          <motion.button
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            onClick={markAllAsRead}
            whileHover={{ scale: 1.05 }}
          >
            <Bell size={20} />
            Mark All as Read
          </motion.button>
        </div>
      </motion.div>

      {/* Notification List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className="p-4 bg-white rounded-lg shadow-sm flex items-start gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`p-2 rounded-full ${badgeColors[notification.type]}`}>
              {icons[notification.type]}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{notification.title}</h3>
              <p className="text-sm text-gray-600">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => editNotification(notification)}
            >
              <Edit size={16} />
            </button>
            <button
              className="text-gray-500 hover:text-red-500"
              onClick={() => removeNotification(notification.id)}
            >
              <XCircle size={16} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <motion.div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
          <motion.div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Notification</h2>
            <div className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={currentNotification?.title}
                onChange={(e) => setCurrentNotification({ ...currentNotification, title: e.target.value })}
              />
              <textarea
                name="message"
                placeholder="Message"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={currentNotification?.message}
                onChange={(e) => setCurrentNotification({ ...currentNotification, message: e.target.value })}
              />
              {/* Dropdown for notification type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Type</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={currentNotification?.type}
                  onChange={(e) => setCurrentNotification({ ...currentNotification, type: e.target.value })}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotification}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ManageNotifications;
