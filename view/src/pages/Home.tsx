import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { client } from "../lib/rpc";

export const Home: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  
  const { data, isLoading } = useQuery({
    queryKey: ["auth-check"],
    queryFn: () => client.GET_CURRENT_USER({}),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (data?.user) {
        // User is logged in, redirect to app
        window.location.href = "/app";
      } else {
        setIsChecking(false);
      }
    }
  }, [data, isLoading]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleGetStarted = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Schema OS" className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">Schema OS</span>
          </div>
          <Button onClick={handleGetStarted} variant="default">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Visual Database Schema Design
            <span className="text-blue-600"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Design, explore, and manage your database schemas with an intuitive visual interface powered by AI assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              onClick={handleGetStarted} 
              size="lg"
              className="px-8 py-6 text-lg"
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-lg"
              onClick={() => window.open("https://github.com/deco-chat/schemaos", "_blank")}
            >
              View on GitHub
            </Button>
          </div>
          
          {/* Temporary Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Temporary Requirement:</strong> If you haven't installed this app before on your workspace, 
              please go to <a href="https://deco.chat" className="underline font-semibold" target="_blank" rel="noopener noreferrer">deco.chat</a> and 
              search for the "Schema OS" app in the Add Integration flow.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything you need for schema management
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Visual Schema Editor</h3>
                <p className="text-gray-600">
                  Drag-and-drop interface for creating and editing database schemas visually
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Assistant</h3>
                <p className="text-gray-600">
                  Get intelligent suggestions for schema improvements and SQL generation
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Database Integration</h3>
                <p className="text-gray-600">
                  Connect to your SQLite database and import existing schemas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to streamline your database design?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join teams using Schema OS to build better databases faster.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg"
          >
            Start Building Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img src="/logo.png" alt="Schema OS" className="h-6 w-auto" />
              <span className="text-sm text-gray-600">© 2024 Schema OS. All rights reserved.</span>
            </div>
            <div className="flex space-x-6">
              <a href="https://github.com/deco-chat/schemaos" className="text-sm text-gray-600 hover:text-gray-900">
                GitHub
              </a>
              <a href="https://docs.deco.chat" className="text-sm text-gray-600 hover:text-gray-900">
                Documentation
              </a>
              <a href="https://deco.chat" className="text-sm text-gray-600 hover:text-gray-900">
                Deco Platform
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
