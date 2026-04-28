import { onAuthStateChanged, signOut } from "firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../config/firebase";
import { listProviderKeys } from "../services/ai";
import {
  fetchUsageStats,
  getOfflineCaseCache,
  saveOfflineCaseCache,
  saveUserProfile,
  subscribeToCases,
  subscribeToLogs,
  subscribeToUserProfile,
} from "../services/firestore";

const AppContext = createContext(null);

const DEFAULT_PREFERENCES = {
  theme: "dark",
  ai_mode: "simple",
};

const DEFAULT_PRO = {
  selectedAIs: ["gemini-flash", "openai-gpt4o-mini"],
  debateRounds: 2,
  enableDebateLoop: true,
  enableConvergenceCheck: true,
  aggregationStrategy: "majority",
  sensitiveAttributes: ["age", "gender", "region"],
  biasThreshold: 20,
  twinIntensity: "medium",
  maxTwins: 12,
  explanationDepth: "brief",
};

const DEFAULT_RULES = {
  equalOpportunity: true,
  demographicParity: false,
  maxBiasScore: 35,
};

const DEFAULT_ROLE = "analyst";

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [logs, setLogs] = useState([]);
  const [usageStats, setUsageStats] = useState({ totalCases: 0, proModeCount: 0, lastActivity: null, averageBias: 0, domainBreakdown: {} });
  const [mode, setMode] = useState("normal");
  const [selectedAIs, setSelectedAIs] = useState(DEFAULT_PRO.selectedAIs);
  const [debateRounds, setDebateRounds] = useState(DEFAULT_PRO.debateRounds);
  const [apiKeys, setApiKeys] = useState([]);
  const [networkError, setNetworkError] = useState("");
  const [isVaultFallback, setIsVaultFallback] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "unsupported",
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const seenCaseNotificationsRef = useRef(new Map());
  const role = userProfile?.role ?? null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      setProfileLoading(false);
      setCases([]);
      setLogs([]);
      setApiKeys([]);
      setNotificationsEnabled(false);
      seenCaseNotificationsRef.current = new Map();
      return undefined;
    }

    const unsubscribeProfile = subscribeToUserProfile(
      currentUser.uid,
      (profile) => {
        setUserProfile(profile);
        setProfileLoading(false);
        const preferences = profile?.preferences ?? DEFAULT_PREFERENCES;
        const proSettings = profile?.proSettings ?? DEFAULT_PRO;
        setMode(proSettings.defaultMode ?? "normal");
        setSelectedAIs(proSettings.selectedAIs ?? DEFAULT_PRO.selectedAIs);
        setDebateRounds(proSettings.debateRounds ?? DEFAULT_PRO.debateRounds);
        setNotificationsEnabled(Boolean(preferences.notificationsEnabled));
        document.documentElement.classList.toggle("dark", preferences.theme === "dark");
      },
      (error) => setNetworkError(error.message),
    );

    const unsubscribeCases = subscribeToCases(
      currentUser.uid,
      (nextCases) => {
        setCases(nextCases);
        setNetworkError("");
      },
      (error) => {
        setNetworkError(error.message);
        const cachedCase = getOfflineCaseCache();
        setCases(cachedCase ? [cachedCase] : []);
      },
    );

    const unsubscribeLogs = subscribeToLogs(currentUser.uid, setLogs, () => {});
    fetchUsageStats(currentUser.uid).then(setUsageStats).catch(() => {});

    return () => {
      unsubscribeProfile();
      unsubscribeCases();
      unsubscribeLogs();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    listProviderKeys()
      .then((keys) => {
        setApiKeys(keys);
        setNetworkError("");
        if (keys.some(k => k.id?.startsWith('local_'))) {
          setIsVaultFallback(true);
        }
      })
      .catch((error) => {
        setApiKeys([]);
        setNetworkError(error.message);
        setIsVaultFallback(true);
      });
  }, [userProfile, role]);

  useEffect(() => {
    if (cases[0]) {
      saveOfflineCaseCache(cases[0]).catch(() => {});
    }
  }, [cases]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(window.Notification.permission);
  }, []);

  useEffect(() => {
    if (!currentUser || !notificationsEnabled || notificationPermission !== "granted" || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const seenMap = seenCaseNotificationsRef.current;

    if (seenMap.size === 0) {
      cases.forEach((entry) => {
        seenMap.set(entry.id, entry.status);
      });
      return;
    }

    cases.forEach((entry) => {
      const previousStatus = seenMap.get(entry.id);
      const nextStatus = entry.status;
      const justCompleted = nextStatus === "complete" && previousStatus && previousStatus !== "complete";
      const newCompletedCase = nextStatus === "complete" && !previousStatus;

      if (justCompleted || newCompletedCase) {
        const title = entry.mode === "pro" ? "Pro audit complete" : "Audit complete";
        const body = `${entry.domain || "Case"} finished with ${entry.finalResult?.riskLevel || "unknown"} risk and bias score ${entry.finalResult?.bias_score ?? "N/A"}.`;
        const notification = new window.Notification(title, {
          body,
          tag: `case-${entry.id}`,
        });
        notification.onclick = () => {
          window.focus();
        };
      }

      seenMap.set(entry.id, nextStatus);
    });
  }, [cases, currentUser, notificationPermission, notificationsEnabled]);

  const refreshApiKeys = async () => {
    try {
      const keys = await listProviderKeys();
      setApiKeys(keys);
      setNetworkError("");
      if (keys.some(k => k.id?.startsWith('local_'))) {
        setIsVaultFallback(true);
      }
      return keys;
    } catch (error) {
      setApiKeys([]);
      setNetworkError(error.message);
      setIsVaultFallback(true);
      throw error;
    }
  };

  const persistPreferences = async (nextPreferences) => {
    if (!currentUser) return;
    const nextProfile = {
      ...userProfile,
      preferences: {
        ...(userProfile?.preferences ?? DEFAULT_PREFERENCES),
        ...nextPreferences,
      },
    };
    delete nextProfile.id;
    await saveUserProfile(currentUser.uid, nextProfile);
  };

  const requestNotificationAccess = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { status: "unsupported" };
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotificationsEnabled(true);
      await persistPreferences({ notificationsEnabled: true });
      new window.Notification("BiasGuard X notifications enabled", {
        body: "You will now get alerts when audits complete.",
        tag: "notifications-enabled",
      });
    } else {
      setNotificationsEnabled(false);
      await persistPreferences({ notificationsEnabled: false });
    }

    return { status: permission };
  };

  const disableNotifications = async () => {
    setNotificationsEnabled(false);
    if (currentUser) {
      await persistPreferences({ notificationsEnabled: false });
    }
  };

  // Real-time Usage Stats from cases
  const computedUsage = useMemo(() => {
    const totalCases = cases.length;
    const proModeCount = cases.filter(c => c.mode === 'pro').length;
    const averageBias = totalCases
      ? Math.round(cases.reduce((sum, c) => sum + Number(c.finalResult?.bias_score ?? c.finalResult?.biasScore ?? 0), 0) / totalCases)
      : 0;
    
    const domainBreakdown = cases.reduce((acc, c) => {
      acc[c.domain] = (acc[c.domain] || 0) + 1;
      return acc;
    }, {});

    return { totalCases, proModeCount, averageBias, domainBreakdown, lastActivity: cases[0]?.createdAt || null };
  }, [cases]);

  const completeRoleSelection = async (roleChoice) => {
    if (!currentUser) {
      return;
    }

    await saveUserProfile(currentUser.uid, {
      uid: currentUser.uid,
      name: currentUser.displayName || currentUser.email?.split("@")[0] || "BiasGuard User",
      email: currentUser.email || "",
      role: roleChoice || DEFAULT_ROLE,
      createdAt: new Date().toISOString(),
      preferences: DEFAULT_PREFERENCES,
      proSettings: {
        ...DEFAULT_PRO,
        defaultMode: "normal",
      },
      fairnessRules: DEFAULT_RULES,
    });
  };

  const updateProfileSettings = async (patch) => {
    if (!currentUser) {
      return;
    }
    const nextProfile = { ...userProfile, ...patch };
    delete nextProfile.id;
    await saveUserProfile(currentUser.uid, nextProfile);
  };

  const logout = () => signOut(auth);
  const latestCase = cases[0] ?? null;

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      role,
      mode,
      setMode,
      selectedAIs,
      setSelectedAIs,
      debateRounds,
      setDebateRounds,
      latestCase,
      apiKeys,
      refreshApiKeys,
      logs,
      cases,
      usageStats: computedUsage,
      networkError,
      isVaultFallback,
      notificationPermission,
      notificationsEnabled,
      authLoading,
      profileLoading,
      needsRoleSelection: Boolean(currentUser) && !role && !profileLoading,
      completeRoleSelection,
      requestNotificationAccess,
      disableNotifications,
      updateProfileSettings,
      logout,
    }),
    [apiKeys, authLoading, profileLoading, cases, currentUser, debateRounds, latestCase, logs, mode, networkError, isVaultFallback, notificationPermission, notificationsEnabled, role, selectedAIs, usageStats, userProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
