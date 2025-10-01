import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export type ProfileLockState = {
  locked: boolean;
  loading: boolean;
  user: User | null;
};

const ProfileLockContext = createContext<ProfileLockState>({
  locked: false,
  loading: true,
  user: null,
});

export function ProfileLockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (!u?.uid) {
        setLocked(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      const ref = doc(db, "users", u.uid);
      unsubProfile = onSnapshot(
        ref,
        (snap) => {
          const d = snap.data() as any | undefined;
          const name = String(d?.name || "").trim();
          const phone = String(d?.phone || "").trim();
          const instituteName = String(d?.instituteName || "").trim();
          const complete = !!(name && phone && instituteName);
          setLocked(!complete);
          setLoading(false);
        },
        () => {
          setLocked(true);
          setLoading(false);
        },
      );
    });
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const value = useMemo(
    () => ({ locked, loading, user }),
    [locked, loading, user],
  );
  return (
    <ProfileLockContext.Provider value={value}>
      {children}
    </ProfileLockContext.Provider>
  );
}

export function useProfileLock() {
  return useContext(ProfileLockContext);
}
