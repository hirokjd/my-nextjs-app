import React, { useState, useEffect } from "react";

const Modal = ({
  title,
  onClose,
  onSave,
  initialData = {},
  fields = [],
  isLoading = false,
  error = null,
  onChange,
  modalWidthClass = "w-full max-w-md", // Default for centered modals
  customPosition = null // New prop for custom positioning e.g., { top: '10vh', left: '35vw', right: '25vw', bottom: '10vh' }
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
    if (onChange) {
      onChange(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);
    const missingFields = fields
      .filter(field => field.required)
      .filter(field => !formData[field.name] && formData[field.name] !== 0 && formData[field.name] !== false)
      .map(field => field.label);

    if (missingFields.length > 0) {
      setLocalError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }
    onSave(formData);
  };

  const isCustomPositioned = customPosition && Object.keys(customPosition).length > 0;

  const overlayClasses = `fixed inset-0 z-50 bg-gray-900 bg-opacity-50 p-4 overflow-y-auto ${
    !isCustomPositioned ? 'flex items-center justify-center' : ''
  }`;

  let dialogStyle = {};
  if (isCustomPositioned) {
    dialogStyle = {
      position: 'absolute',
      top: customPosition.top,
      left: customPosition.left,
      right: customPosition.right,
      bottom: customPosition.bottom,
      // Width and height are implicitly defined by top/bottom/left/right
    };
  }

  const dialogBaseClasses = "bg-white rounded-lg shadow-xl flex flex-col"; // Added flex flex-col
  const dialogSizingClasses = isCustomPositioned 
    ? "" // Sizing is handled by inline styles from customPosition
    : modalWidthClass; // Use modalWidthClass for centered modals
  const dialogMaxHeightClass = isCustomPositioned ? "" : "max-h-[90vh]"; // Apply max-h only if not custom positioned with bottom

  return (
    <div className={overlayClasses}>
      <div 
        className={`${dialogBaseClasses} ${dialogSizingClasses} ${dialogMaxHeightClass}`}
        style={isCustomPositioned ? dialogStyle : {}}
      >
        <div className="p-6 border-b border-gray-200"> {/* Header part */}
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow"> {/* Content part, flex-grow for scroll */}
          {(error || localError) && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p>{error || localError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {fields.length > 0 ? (
                fields.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    
                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading || field.disabled}
                        required={field.required}
                      >
                        {field.placeholder && <option value="">{field.placeholder}</option>}
                        {field.options.map((option) => (
                          <option key={option.value || option} value={option.value || option}>
                            {option.label || option}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={field.rows || 3}
                        disabled={isLoading || field.disabled}
                        required={field.required}
                        placeholder={field.placeholder || ""}
                      />
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name] || (field.type === "number" ? "" : "")}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading || field.disabled}
                        required={field.required}
                        placeholder={field.placeholder || ""}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No fields provided.</p>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200"> {/* Footer part, added pt-4 and border-t */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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