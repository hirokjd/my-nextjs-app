import React, { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { account } from "../../utils/appwrite";

const SettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    try {
      await account.updatePassword(newPassword, currentPassword);
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error.message);
      alert("Failed to update password: " + error.message);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">Admin Settings</h2>

      {/* Change Password */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Change Password</h3>
        <input
          type="password"
          placeholder="Current Password"
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="New Password"
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleChangePassword}>
          Update Password
        </button>
      </div>

      {/* System Preferences */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">System Preferences</h3>
        <p className="text-gray-600">More settings can be added here...</p>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
