import React, { useState } from "react";
import { Bell, Info, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    type: "info",
    title: "New Exam Schedule",
    message: "Mathematics final exam has been scheduled for next week.",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "warning",
    title: "System Maintenance",
    message: "The system will be under maintenance on Sunday, 2 AM - 4 AM.",
    time: "1 day ago",
  },
  {
    id: 3,
    type: "success",
    title: "Results Published",
    message: "Physics mid-term exam results have been published.",
    time: "2 days ago",
  },
  {
    id: 4,
    type: "error",
    title: "Payment Failed",
    message: "Your exam registration payment was unsuccessful.",
    time: "3 days ago",
  },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const getIcon = (type) => {
    switch (type) {
      case "info":
        return <Info className="text-blue-500" size={20} />;
      case "warning":
        return <AlertCircle className="text-amber-500" size={20} />;
      case "success":
        return <CheckCircle className="text-emerald-500" size={20} />;
      case "error":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-600";
      case "warning":
        return "bg-amber-100 text-amber-600";
      case "success":
        return "bg-emerald-100 text-emerald-600";
      case "error":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-start"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${getBadgeColor(notification.type)} bg-opacity-20`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-gray-500 mt-1">{notification.message}</p>
                    <span className="text-sm text-gray-400">{notification.time}</span>
                  </div>
                </div>
                <button onClick={() => removeNotification(notification.id)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <Bell size={32} className="mx-auto mb-2 text-gray-400" />
            No new notifications
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
