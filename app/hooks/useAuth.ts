import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

/**
 * Hook to provide Firebase authentication state.
 * Returns the current user (or null) and a loading flag while the auth state is being resolved.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
