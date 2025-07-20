import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { account } from '../utils/appwrite';
import { getCurrentStudentSession, logoutStudent } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null); // 'admin' or 'student'
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if it's an admin route
        if (router.pathname.startsWith('/admin')) {
          const adminUser = await account.get();
          setUser(adminUser);
          setUserType('admin');
        } else if (router.pathname.startsWith('/student')) {
          // Check for student session
          const studentSession = getCurrentStudentSession();
          if (studentSession) {
            setUser(studentSession);
            setUserType('student');
          } else {
            // Redirect to login if no session
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (router.pathname.startsWith('/admin')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router.pathname]);

  const logout = async () => {
    try {
      if (userType === 'admin') {
        await account.deleteSession('current');
      } else {
        logoutStudent();
      }
      setUser(null);
      setUserType(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    userType,
    loading,
    logout,
    isAuthenticated: !!user,
    isAdmin: userType === 'admin',
    isStudent: userType === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 