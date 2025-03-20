import React, { useState } from "react";

const Modal = ({ title, onClose, onSave, initialData, fields }) => {
  const [formData, setFormData] = useState(initialData || {});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        {fields.map((field) => (
          <div key={field.name} className="mb-3">
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={() => onSave(formData)} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
