import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Database } from '../lib/supabase';
import { storage } from '../lib/storage';
import { User } from '@supabase/supabase-js';

type Fridge = Database['fridges'];
type Dish = Database['dishes'];
type Promotion = Database['promotions'];
type UserProfile = Database['users'];

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
  currentFridge: Fridge | null;
  setCurrentFridge: (fridge: Fridge | null) => void;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentFridge, setCurrentFridgeState] = useState<Fridge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    const savedFridgeId = storage.getCurrentFridge();
    if (savedFridgeId) {
      loadFridge(savedFridgeId);
    }

    return () => subscription.unsubscribe();
  }, []);

  const loadFridge = async (fridgeId: string) => {
    const { data, error } = await supabase
      .from('fridges')
      .select('*')
      .eq('id', fridgeId)
      .maybeSingle();

    if (!error && data) {
      setCurrentFridgeState(data as Fridge);
    }
  };

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setUserProfile(data as UserProfile);
    }
  };

  const setCurrentFridge = (fridge: Fridge | null) => {
    setCurrentFridgeState(fridge);
    if (fridge) {
      storage.setCurrentFridge(fridge.id);
    } else {
      storage.clearCurrentFridge();
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          loyalty_points: 0,
          is_admin: false,
        });

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const isAdmin = userProfile?.is_admin === true;

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        currentFridge,
        setCurrentFridge,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        refreshUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
