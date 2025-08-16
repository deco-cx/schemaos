import React, { useEffect } from "react";

export const AfterLogin: React.FC = () => {
  useEffect(() => {
    // After successful OAuth, redirect to the app
    // The cookies should already be set by Deco
    window.location.href = "/app";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};
