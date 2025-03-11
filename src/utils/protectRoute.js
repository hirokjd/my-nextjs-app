import { useEffect } from "react";
import { useRouter } from "next/router";
import { account } from "./appwrite";

const protectRoute = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          await account.get();
        } catch (error) {
          router.replace("/login"); // Redirect to login if not authenticated
        }
      };

      checkAuth();
    }, []);

    return <WrappedComponent {...props} />;
  };
};

export default protectRoute;
