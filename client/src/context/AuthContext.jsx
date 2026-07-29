import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase not initialized");
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Supabase fires this on every tab focus/visibility change, even when
    // the session hasn't actually changed (documented library behavior,
    // not a bug in this app) — only update state when something genuinely
    // changed, so a tab refocus doesn't cascade into every dashboard
    // re-fetching its data and feeling like a reload.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(prev => {
        if (prev?.access_token === newSession?.access_token && prev?.user?.id === newSession?.user?.id) {
          return prev; // identical reference in, identical reference out — React skips the re-render
        }
        return newSession ?? null;
      });
      setUser(prev => {
        if (prev?.id === newSession?.user?.id) return prev;
        return newSession?.user ?? null;
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, fullName) => {
    if (!supabase) throw new Error("Auth not available");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    return data;
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error("Auth not available");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  };

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error("Auth not available");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);