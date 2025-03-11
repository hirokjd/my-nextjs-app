import React, { useEffect } from "react";
import { useRouter } from "next/router";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    // Check the user's role (e.g., from local storage or cookies)
    const userRole = localStorage.getItem("userRole"); // Replace with your actual role storage logic

    // Redirect based on the user's role
    if (userRole === "admin") {
      router.push("/admin/dashboard");
    } else if (userRole === "student") {
      router.push("/student/dashboard");
    } else {
      // If no role is found, redirect to the login page
      router.push("/login");
    }
  }, [router]);

  return null; // Render nothing while redirecting
};

export default Home;