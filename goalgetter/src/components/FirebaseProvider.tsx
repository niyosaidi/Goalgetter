import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, Goal, Saving, Spending } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  goals: Goal[];
  savings: Saving[];
  spending: Spending[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [spending, setSpending] = useState<Spending[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Test connection
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }

        const userDoc = doc(db, 'users', u.uid);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName,
            email: u.email || '',
            currency: 'USD',
            monthlyBudget: 0
          };
          await setDoc(userDoc, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(snap.data() as UserProfile);
        }
      } else {
        setProfile(null);
        setGoals([]);
        setSavings([]);
        setSpending([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const goalsQuery = query(collection(db, 'goals'), where('userId', '==', user.uid), orderBy('priority', 'asc'));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Goal)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'goals'));

    const savingsQuery = query(collection(db, 'savings'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribeSavings = onSnapshot(savingsQuery, (snap) => {
      setSavings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Saving)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'savings'));

    const spendingQuery = query(collection(db, 'spending'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribeSpending = onSnapshot(spendingQuery, (snap) => {
      setSpending(snap.docs.map(d => ({ id: d.id, ...d.data() } as Spending)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'spending'));

    return () => {
      unsubscribeGoals();
      unsubscribeSavings();
      unsubscribeSpending();
    };
  }, [user]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userDoc = doc(db, 'users', user.uid);
    await setDoc(userDoc, data, { merge: true });
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      }
    };
    const jsonString = JSON.stringify(errInfo);
    console.error('Firestore Error:', jsonString);
    throw new Error(jsonString);
  };

  return (
    <FirebaseContext.Provider value={{ user, profile, loading, goals, savings, spending, login, logout, updateProfile }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};
