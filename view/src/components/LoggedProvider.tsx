import React, { createContext, PropsWithChildren, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "../lib/rpc";

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface Workspace {
  id: string;
  slug: string;
  name: string;
}

interface AuthContextData {
  user?: User;
  workspace?: Workspace;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within LoggedProvider");
  }
  return context;
};

interface LoggedProviderProps {
  redirectToLogin?: boolean;
}

export const LoggedProvider: React.FC<PropsWithChildren<LoggedProviderProps>> = ({ 
  children,
  redirectToLogin = true 
}) => {
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => client.GET_CURRENT_USER({}),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (query.isError || !query.data?.user) {
    if (redirectToLogin) {
      window.location.href = "/login";
      return null;
    }
    return null;
  }

  return (
    <AuthContext.Provider value={query.data}>
      {children}
    </AuthContext.Provider>
  );
};
