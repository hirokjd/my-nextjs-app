import React, { useState, useEffect } from "react";

const Modal = ({ 
  title, 
  onClose, 
  onSave, 
  initialData = {}, 
  fields = [], 
  isLoading = false,
  error = null,
  onChange
}) => {
  const [formData, setFormData] = useState({});
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    setFormData(initialData || {});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));

    // Call external onChange if provided
    if (onChange) {
      onChange(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);

    // Validate required fields
    const missingFields = fields
      .filter(field => field.required)
      .filter(field => !formData[field.name] && formData[field.name] !== 0)
      .map(field => field.label);

    if (missingFields.length > 0) {
      setLocalError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold card-heading">{title}</h3>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {(error || localError) && (
            <div className="mb-4 p-3 bg-danger/10 border-l-4 border-danger text-danger rounded">
              <p>{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {fields.length > 0 ? (
                fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="block text-sm font-medium text-card-foreground">
                      {field.label}
                      {field.required && <span className="text-danger"> *</span>}
                    </label>
                    
                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="form-select w-full"
                        disabled={isLoading}
                        required={field.required}
                      >
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="form-textarea w-full"
                        rows={3}
                        disabled={isLoading}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="form-input w-full"
                        disabled={isLoading}
                        required={field.required}
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted">No fields provided.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Modal;