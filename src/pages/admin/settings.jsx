import React, { useState, useEffect } from "react";
import { account } from "../../utils/appwrite";
import { User, Lock } from "lucide-react";

const SettingsPage = () => {
  const [admin, setAdmin] = useState({ name: "", email: "" });
  const [password, setPassword] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAdminDetails();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchAdminDetails = async () => {
    try {
      const user = await account.get();
      setAdmin({ name: user.name, email: user.email });
    } catch (error) {
      setError("Failed to fetch admin details: " + error.message);
      console.error("Error fetching admin details:", error.message);
    }
  };

  const handleProfileUpdate = async () => {
    setError(null);
    setSuccess(null);
    if (!admin.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    try {
      await account.updateName(admin.name.trim());
      setSuccess("Profile updated successfully!");
    } catch (error) {
      setError("Failed to update profile: " + error.message);
      console.error("Error updating profile:", error.message);
    }
  };

  const handlePasswordUpdate = async () => {
    setError(null);
    setSuccess(null);
    if (!password.oldPassword || !password.newPassword || !password.confirmPassword) {
      setError("All password fields are required.");
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    try {
      await account.updatePassword(password.newPassword, password.oldPassword);
      setSuccess("Password updated successfully!");
      setPassword({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setError("Failed to update password: " + error.message);
      console.error("Error updating password:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-6">Settings</h2>

        {/* Error/Success Alerts */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6" role="alert">
            <strong className="font-bold">Success:</strong>
            <span className="block sm:inline ml-2">{success}</span>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <User size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Profile Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={admin.name}
                onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={admin.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleProfileUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-base font-semibold shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                Old Password
              </label>
              <input
                type="password"
                id="oldPassword"
                placeholder="Enter old password"
                value={password.oldPassword}
                onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={password.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-800"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={password.confirmPassword}
                onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-800"
              />
            </div>
            <button
              onClick={handlePasswordUpdate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-base font-semibold shadow-sm"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;