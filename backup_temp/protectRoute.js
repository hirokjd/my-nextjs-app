//src/utils/protectRoute.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { account } from "./appwrite";

const protectRoute = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          let user = null;

          if (router.pathname.startsWith("/admin")) {
            // ✅ Admin Authentication (via Appwrite Auth)
            user = await account.get();
          } else {
            // ✅ Student Authentication (via localStorage)
            const studentSession = localStorage.getItem("studentSession");
            if (studentSession) {
              console.log("✅ Student session found in protectRoute:", studentSession);
              user = JSON.parse(studentSession);
            }
          }

          if (user) {
            setIsAuthenticated(true);
          } else {
            throw new Error("Not authenticated");
          }
        } catch (error) {
          setIsAuthenticated(false);
          router.replace("/login"); // ❌ Redirect if not authenticated
        }
      };

      checkAuth();
    }, []);

    if (isAuthenticated === null) {
      return <p>Loading...</p>; // ✅ Prevents flashing protected page
    }

    return <WrappedComponent {...props} />;
  };
};

export default protectRoute;
