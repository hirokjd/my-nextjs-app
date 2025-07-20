import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = 'Loading...',
  fullScreen = false,
  variant = 'spinner' // 'spinner' or 'dots' or 'pulse'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500',
    purple: 'border-purple-500'
  };

  const gradientClasses = {
    blue: 'from-blue-500 to-purple-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-pink-600',
    gray: 'from-gray-500 to-gray-600',
    purple: 'from-purple-500 to-indigo-600'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 bg-gradient-to-r ${gradientClasses[color]} rounded-full`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={`w-full h-full bg-gradient-to-r ${gradientClasses[color]} rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        );
      
      default: // spinner
        return (
          <motion.div
            className={`${sizeClasses[size]} border-2 border-gray-200 ${colorClasses[color]} rounded-full`}
            style={{ borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
          />
        );
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center">
      {renderSpinner()}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-sm text-gray-600 font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {content}
        </motion.div>
      </motion.div>
    );
  }

  return content;
};

export default LoadingSpinner; 