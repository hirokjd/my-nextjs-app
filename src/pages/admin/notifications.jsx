import React, { useState, useEffect } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import { databases } from "../../utils/appwrite";
import { ID } from "appwrite";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [message, setMessage] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID
      );
      setNotifications(response.documents);
    } catch (error) {
      console.error("Error fetching notifications:", error.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!message.trim()) {
      alert("Notification message cannot be empty.");
      return;
    }

    try {
      if (editingNotification) {
        await databases.updateDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
          editingNotification.$id,
          { message, scheduleDate: scheduleDate || null }
        );
      } else {
        await databases.createDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
          ID.unique(),
          { message, scheduleDate: scheduleDate || null, status: "Scheduled" }
        );
      }

      setModalOpen(false);
      setEditingNotification(null);
      setMessage("");
      setScheduleDate("");
      fetchNotifications();
    } catch (error) {
      console.error("Error saving notification:", error.message);
    }
  };

  const handleEdit = (notification) => {
    setEditingNotification(notification);
    setMessage(notification.message);
    setScheduleDate(notification.scheduleDate || "");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        id
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📢 Manage Notifications</h2>

      <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4" onClick={() => setModalOpen(true)}>
        ➕ Add Notification
      </button>

      {loading ? (
        <p>Loading notifications...</p>
      ) : (
        <Table
          data={notifications.map((n) => ({
            Message: n.message,
            "Scheduled Date": n.scheduleDate ? new Date(n.scheduleDate).toLocaleString() : "Immediate",
            Status: n.status,
            Actions: (
              <div className="flex gap-2">
                <button className="text-blue-500" onClick={() => handleEdit(n)}>✏️ Edit</button>
                <button className="text-red-500" onClick={() => handleDelete(n.$id)}>🗑️ Delete</button>
              </div>
            ),
          }))}
        />
      )}

      {modalOpen && (
        <Modal
          title={editingNotification ? "Edit Notification" : "Create Notification"}
          onClose={() => {
            setModalOpen(false);
            setEditingNotification(null);
            setMessage("");
            setScheduleDate("");
          }}
          onSave={handleSave}
        >
          <label className="block mb-1 font-semibold">Message</label>
          <textarea
            placeholder="Notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
          />
          
          <label className="block mb-1 font-semibold">📅 Schedule Notification (Optional)</label>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </Modal>
      )}
    </div>
  );
};

export default NotificationsPage;
