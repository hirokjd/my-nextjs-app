import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { account, databases } from "../../utils/appwrite";

const SettingsPage = () => {
  const [admin, setAdmin] = useState({ name: "", email: "" });
  const [password, setPassword] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [preferences, setPreferences] = useState({ notifications: true });
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetchAdminDetails();
  }, []);

  const fetchAdminDetails = async () => {
    try {
      const user = await account.get();
      setAdmin({ name: user.name, email: user.email });

      const settings = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID,
        "system_preferences"
      );
      setPreferences(settings.preferences || { notifications: true });
    } catch (error) {
      console.error("Error fetching admin details:", error.message);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await account.updateName(admin.name);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error.message);
    }
  };

  const handlePasswordUpdate = async () => {
    if (password.newPassword !== password.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await account.updatePassword(password.newPassword, password.oldPassword);
      alert("Password updated successfully!");
      setPassword({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error updating password:", error.message);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID,
        "system_preferences",
        { preferences }
      );
      alert("Preferences updated!");
    } catch (error) {
      console.error("Error updating preferences:", error.message);
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-4">⚙️ Admin Settings</h2>

      {/* Profile Settings */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">👤 Profile Settings</h3>
        <input
          type="text"
          value={admin.name}
          onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
          placeholder="Admin Name"
          className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
        />
        <input
          type="email"
          value={admin.email}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded mb-2 bg-gray-100"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleProfileUpdate}>
          Save Profile
        </button>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">🔒 Change Password</h3>
        <input
          type="password"
          placeholder="Old Password"
          value={password.oldPassword}
          onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
        />
        <input
          type="password"
          placeholder="New Password"
          value={password.newPassword}
          onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={password.confirmPassword}
          onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handlePasswordUpdate}>
          Update Password
        </button>
      </div>

      {/* System Preferences */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">⚙️ System Preferences</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.notifications}
            onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
          />
          Enable Notifications
        </label>
        <button className="bg-blue-500 text-white px-4 py-2 rounded mt-4" onClick={handlePreferencesUpdate}>
          Save Preferences
        </button>
      </div>

      {/* API Key Management */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">🔑 API Key Management</h3>
        <input
          type="password"
          placeholder="Enter API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-2"
        />
        <button className="bg-red-500 text-white px-4 py-2 rounded">Update API Key</button>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;
