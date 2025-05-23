import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <motion.button 
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted-light/30 hover:bg-muted-light/70 transition-all duration-200"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{ 
        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.3)' : 'rgba(243, 244, 246, 0.3)' 
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDark ? 0 : 180,
          opacity: [0, 1],
          scale: [0.5, 1] 
        }}
        transition={{ 
          duration: 0.3,
          ease: 'easeInOut'
        }}
      >
        {isDark ? (
          <Sun size={20} className="text-primary-light" />
        ) : (
          <Moon size={20} className="text-primary" />
        )}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle; 