import React, { useEffect } from "react";

export const Logout: React.FC = () => {
  useEffect(() => {
    // Clear auth cookies by making a request to logout endpoint
    const logout = async () => {
      try {
        // This will clear the deco auth cookies
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        // Always redirect to home after logout attempt
        window.location.href = '/';
      }
    };
    
    logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Signing out...</p>
      </div>
    </div>
  );
};
