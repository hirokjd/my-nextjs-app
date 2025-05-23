import React, { useState, useEffect } from "react";
import { account } from "../../utils/appwrite";
import { User, Lock, Key } from "lucide-react";

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          <span className="inline-flex items-center gap-2">
            Admin Settings
          </span>
        </h2>
      </div>

      {/* Profile Settings */}
      <div className="dashboard-card mb-6">
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">
            <User size={18} className="text-primary" />
            <span>Profile Settings</span>
          </h3>
        </div>
        <div className="dashboard-card-content">
          <input
            type="text"
            value={admin.name}
            onChange={(e) => setAdmin({ ...admin, name: e.target.value })}
            placeholder="Admin Name"
            className="form-input w-full mb-3"
          />
          <input
            type="email"
            value={admin.email}
            disabled
            className="form-input w-full mb-4 bg-muted-light"
          />
          <button className="btn btn-primary" onClick={handleProfileUpdate}>
            Save Profile
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="dashboard-card mb-6">
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">
            <Lock size={18} className="text-primary" />
            <span>Change Password</span>
          </h3>
        </div>
        <div className="dashboard-card-content">
          <input
            type="password"
            placeholder="Current Password"
            value={password.oldPassword}
            onChange={(e) => setPassword({ ...password, oldPassword: e.target.value })}
            className="form-input w-full mb-3"
          />
          <input
            type="password"
            placeholder="New Password"
            value={password.newPassword}
            onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
            className="form-input w-full mb-3"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={password.confirmPassword}
            onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })}
            className="form-input w-full mb-4"
          />
          <button className="btn btn-secondary" onClick={handlePasswordUpdate}>
            Update Password
          </button>
        </div>
      </div>

      {/* API Key Management */}
      <div className="dashboard-card">
        <div className="dashboard-card-header">
          <h3 className="dashboard-card-title">
            <Key size={18} className="text-primary" />
            <span>API Key Management</span>
          </h3>
        </div>
        <div className="dashboard-card-content">
          <input
            type="password"
            placeholder="Enter API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="form-input w-full mb-4"
          />
          <button className="btn btn-danger">Update API Key</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
