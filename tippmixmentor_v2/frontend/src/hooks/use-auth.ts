'use client';

import { useEffect, useMemo, useState } from 'react';
import { Roles, type Role, isPro, isFree, isTrial, canUseFeature, getTrialRemainingDays } from '@/lib/auth/roles';

// Minimal auth facade reading role from localStorage or cookie.
// This should be replaced with real session/JWT-based logic once available.
interface UserLike {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: Role;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function readRoleFromStorage(): Role | null {
  try {
    if (typeof window === 'undefined') return null;
    const fromLocal = window.localStorage.getItem('tmx_role');
    if (fromLocal && (fromLocal === Roles.guest || fromLocal === Roles.member || fromLocal === Roles.analyst || fromLocal === Roles.admin)) {
      return fromLocal as Role;
    }
    const fromCookie = readCookie('tmx_role');
    if (fromCookie && (fromCookie === Roles.guest || fromCookie === Roles.member || fromCookie === Roles.analyst || fromCookie === Roles.admin)) {
      return fromCookie as Role;
    }
  } catch {
    // ignore
  }
  return null;
}

export function useAuth() {
  const [role, setRole] = useState<Role>('guest');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const r = readRoleFromStorage();
    setRole(r ?? 'guest');
    setLoading(false);
  }, []);

  const isAuthenticated = role !== Roles.guest;

  const user: UserLike | null = useMemo(() => {
    if (!isAuthenticated) return null;
    return { role };
  }, [isAuthenticated, role]);

  // Pro/Free helpers
  const isProUser = isPro(role);
  const isFreeUser = isFree(role);
  const isTrialUser = isTrial(role);
  const trialRemainingDays = getTrialRemainingDays(role);

  // Feature access helpers
  const canUseRealtimeFeed = canUseFeature(role, 'realtime_feed');
  const canUseProFilters = canUseFeature(role, 'pro_filters');
  const canUseLiveConfidence = canUseFeature(role, 'live_confidence');
  const canUseWhyDetails = canUseFeature(role, 'why_details');
  const canUseFollowMatches = canUseFeature(role, 'follow_matches');
  const canUseSaveStrategies = canUseFeature(role, 'save_strategies');

  return {
    user,
    role,
    isAuthenticated,
    loading,
    setRole, // utility for demo/dev
    
    // Pro/Free helpers
    isProUser,
    isFreeUser,
    isTrialUser,
    trialRemainingDays,
    
    // Feature access helpers
    canUseRealtimeFeed,
    canUseProFilters,
    canUseLiveConfidence,
    canUseWhyDetails,
    canUseFollowMatches,
    canUseSaveStrategies,
    
    // Generic feature checker
    canUseFeature: (feature: string) => canUseFeature(role, feature),
  };
}