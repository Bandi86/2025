export type Role = 'guest' | 'member' | 'analyst' | 'admin';

export const Roles: Record<Role, Role> = {
  guest: 'guest',
  member: 'member',
  analyst: 'analyst',
  admin: 'admin',
};

type PermissionMap = Record<string, Role[]>;

// Route/resource -> allowed roles (extend as needed)
export const Permissions: PermissionMap = {
  '/dashboard': ['member', 'analyst', 'admin'],
  '/predictions': ['member', 'analyst', 'admin'],
  '/analytics': ['analyst', 'admin'],
  '/agents': ['analyst', 'admin'],
  '/admin': ['admin'],
};

// Feature gates for Pro/Free differentiation
export const FeatureGates: Record<string, Role[]> = {
  'realtime_feed': ['member', 'analyst', 'admin'],
  'pro_filters': ['analyst', 'admin'],
  'live_confidence': ['analyst', 'admin'],
  'why_details': ['analyst', 'admin'],
  'follow_matches': ['member', 'analyst', 'admin'],
  'save_strategies': ['analyst', 'admin'],
  'advanced_analytics': ['analyst', 'admin'],
  'instant_notifications': ['analyst', 'admin'],
};

export function canAccess(role: Role, resource: string): boolean {
  // Public by default if not listed
  const allowed = Permissions[resource];
  if (!allowed) return true;
  return allowed.includes(role);
}

// Pro/Free gating helpers
export function isPro(role: Role): boolean {
  return role === 'analyst' || role === 'admin';
}

export function isFree(role: Role): boolean {
  return role === 'guest' || role === 'member';
}

export function isTrial(role: Role): boolean {
  return role === 'member'; // Assuming member is trial tier
}

export function canUseFeature(role: Role, feature: string): boolean {
  const allowed = FeatureGates[feature];
  if (!allowed) return true; // Default to allowed if not specified
  return allowed.includes(role);
}

// Trial urgency helpers
export function getTrialRemainingDays(role: Role): number | null {
  if (role !== 'member') return null;
  // Mock implementation - would come from user profile
  return 7; // Mock 7 days remaining
}