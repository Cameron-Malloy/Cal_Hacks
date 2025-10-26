import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

// TypeScript interfaces for your data structure
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  level: number;
  xp: number;
  totalFocusTime: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  achievements: string[];
  badges: string[];
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

export interface FocusSession {
  id?: string;
  userId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number; // in minutes
  focusScore: number; // percentage 0-100
  distractions: number;
  category?: string;
  notes?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly";
  xpReward: number;
  target: number;
  progress: number;
  completedBy: string[];
}

// ========== USER PROFILE FUNCTIONS ==========

// Create or update user profile
export const createUserProfile = async (
  userId: string,
  email: string,
  name: string
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: userId,
      email,
      name,
      level: 1,
      xp: 0,
      totalFocusTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      badges: [],
      createdAt: Timestamp.now(),
      lastActiveAt: Timestamp.now(),
    });
  }
};

// Get user profile
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...updates,
    lastActiveAt: Timestamp.now(),
  });
};

// Add XP and update level
export const addXP = async (userId: string, xpAmount: number): Promise<void> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentXP = userSnap.data().xp || 0;
    const currentLevel = userSnap.data().level || 1;
    const newXP = currentXP + xpAmount;

    // Level up calculation (every 1000 XP = 1 level)
    const newLevel = Math.floor(newXP / 1000) + 1;

    await updateDoc(userRef, {
      xp: newXP,
      level: newLevel,
      lastActiveAt: Timestamp.now(),
    });
  }
};

// ========== FOCUS SESSION FUNCTIONS ==========

// Create a focus session
export const createFocusSession = async (
  sessionData: Omit<FocusSession, "id">
): Promise<string> => {
  const sessionsRef = collection(db, "focusSessions");
  const docRef = doc(sessionsRef);
  await setDoc(docRef, sessionData);

  // Update user's total focus time
  const userRef = doc(db, "users", sessionData.userId);
  await updateDoc(userRef, {
    totalFocusTime: increment(sessionData.duration),
  });

  return docRef.id;
};

// Get user's focus sessions
export const getUserFocusSessions = async (
  userId: string,
  limitCount: number = 10
): Promise<FocusSession[]> => {
  const sessionsRef = collection(db, "focusSessions");
  const q = query(
    sessionsRef,
    where("userId", "==", userId),
    orderBy("startTime", "desc"),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const sessions: FocusSession[] = [];
  querySnapshot.forEach((doc) => {
    sessions.push({ id: doc.id, ...doc.data() } as FocusSession);
  });

  return sessions;
};

// Get sessions for a specific date range
export const getSessionsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FocusSession[]> => {
  const sessionsRef = collection(db, "focusSessions");
  const q = query(
    sessionsRef,
    where("userId", "==", userId),
    where("startTime", ">=", Timestamp.fromDate(startDate)),
    where("startTime", "<=", Timestamp.fromDate(endDate)),
    orderBy("startTime", "desc")
  );

  const querySnapshot = await getDocs(q);
  const sessions: FocusSession[] = [];
  querySnapshot.forEach((doc) => {
    sessions.push({ id: doc.id, ...doc.data() } as FocusSession);
  });

  return sessions;
};

// ========== LEADERBOARD FUNCTIONS ==========

// Get top users by total focus time
export const getLeaderboard = async (
  limitCount: number = 10
): Promise<UserProfile[]> => {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    orderBy("totalFocusTime", "desc"),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const users: UserProfile[] = [];
  querySnapshot.forEach((doc) => {
    users.push(doc.data() as UserProfile);
  });

  return users;
};

// Get top users by XP
export const getLeaderboardByXP = async (
  limitCount: number = 10
): Promise<UserProfile[]> => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("xp", "desc"), limit(limitCount));

  const querySnapshot = await getDocs(q);
  const users: UserProfile[] = [];
  querySnapshot.forEach((doc) => {
    users.push(doc.data() as UserProfile);
  });

  return users;
};

// ========== REAL-TIME LISTENERS ==========

// Listen to user profile changes
export const subscribeToUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
) => {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserProfile);
    } else {
      callback(null);
    }
  });
};

// Listen to leaderboard changes
export const subscribeToLeaderboard = (
  callback: (users: UserProfile[]) => void,
  limitCount: number = 10
) => {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    orderBy("totalFocusTime", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (querySnapshot) => {
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    callback(users);
  });
};

// ========== ACHIEVEMENTS & CHALLENGES ==========

// Unlock achievement
export const unlockAchievement = async (
  userId: string,
  achievementId: string
): Promise<void> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const achievements = userSnap.data().achievements || [];
    if (!achievements.includes(achievementId)) {
      await updateDoc(userRef, {
        achievements: [...achievements, achievementId],
      });
    }
  }
};

// Update streak
export const updateStreak = async (userId: string): Promise<void> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const currentStreak = (userSnap.data().currentStreak || 0) + 1;
    const longestStreak = Math.max(
      currentStreak,
      userSnap.data().longestStreak || 0
    );

    await updateDoc(userRef, {
      currentStreak,
      longestStreak,
      lastActiveAt: Timestamp.now(),
    });
  }
};

// ========== FRIENDS LEADERBOARD FUNCTIONS ==========

// Get friends list for a user
export const getFriendsList = async (userId: string): Promise<UserProfile[]> => {
  const friendsRef = collection(db, "users", userId, "friends");
  const querySnapshot = await getDocs(friendsRef);
  
  const friendIds: string[] = [];
  querySnapshot.forEach((doc) => {
    const friendData = doc.data();
    // The user_id in friends subcollection corresponds to uid in users collection
    if (friendData.user_id) {
      friendIds.push(friendData.user_id);
    }
  });

  // Fetch all friend profiles from users collection
  const friends: UserProfile[] = [];
  for (const friendId of friendIds) {
    const userRef = doc(db, "users", friendId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      friends.push(userSnap.data() as UserProfile);
    }
  }

  return friends;
};

// Get friends leaderboard sorted by totalFocusTime
export const getFriendsLeaderboard = async (userId: string): Promise<UserProfile[]> => {
  const friends = await getFriendsList(userId);
  
  // Sort friends by totalFocusTime descending
  return friends.sort((a, b) => b.totalFocusTime - a.totalFocusTime);
};

// Subscribe to friends leaderboard changes in real-time
export const subscribeToFriendsLeaderboard = (
  userId: string,
  callback: (users: UserProfile[]) => void
) => {
  try {
    const friendsRef = collection(db, "users", userId, "friends");
    
    return onSnapshot(
      friendsRef, 
      async (querySnapshot) => {
        const friendIds: string[] = [];
        querySnapshot.forEach((doc) => {
          const friendData = doc.data();
          if (friendData.user_id) {
            friendIds.push(friendData.user_id);
          }
        });

        // Fetch friend profiles
        const friends: UserProfile[] = [];
        for (const friendId of friendIds) {
          try {
            const userRef = doc(db, "users", friendId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              friends.push(userSnap.data() as UserProfile);
            }
          } catch (error) {
            console.error(`Error fetching friend ${friendId}:`, error);
          }
        }

        // Sort by totalFocusTime
        const sortedFriends = friends.sort((a, b) => b.totalFocusTime - a.totalFocusTime);
        callback(sortedFriends);
      },
      (error) => {
        console.error("Friends leaderboard subscription error:", error);
        // Return empty array on error instead of crashing
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up friends leaderboard subscription:", error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};