"use client"

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      setUser(session.user as User);
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, [session, status]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}