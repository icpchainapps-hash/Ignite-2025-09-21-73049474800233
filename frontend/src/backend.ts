// frontend/src/backend.ts
import type { Principal } from '@dfinity/principal';

/* --------------------------- Public canister id --------------------------- */
export const canisterId: string =
  (globalThis as any)?.CANISTER_ID_BACKEND ??
  (import.meta as any)?.env?.VITE_BACKEND_CANISTER_ID ??
  'aaaaa-aa';

/* ------------------------------- App types -------------------------------- */

// App/admin role (simple app-level role)
export type UserRole = 'admin' | 'user';

/** Runtime + type for team roles */
export const TeamRole = {
  teamAdmin: 'teamAdmin',
  coach: 'coach',
  player: 'player',
  parent: 'parent',
} as const;
export type TeamRole = typeof TeamRole[keyof typeof TeamRole];

/** Runtime + type for club roles */
export const ClubRole = {
  clubAdmin: 'clubAdmin',
} as const;
export type ClubRole = typeof ClubRole[keyof typeof ClubRole];

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  bio?: string;
  isProfileComplete: boolean;
}

export interface Club {
  id: bigint;
  name: string;
  creator: Principal;
}

export interface Team {
  id: bigint;
  clubId: bigint;
  name: string;
  creator: Principal;
}

export interface Message {
  id: bigint;
  threadId: bigint;
  sender: Principal;
  text: string;
  timestamp: bigint;
}

export enum EventType {
  game = 'game',
  training = 'training',
  socialEvent = 'socialEvent',
}

export enum RecurrenceFrequency {
  daily = 'daily',
  weekly = 'weekly',
  monthly = 'monthly',
  custom = 'custom',
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: bigint;
  endDate?: bigint;
  occurrences?: bigint;
}

export interface DutyAssignment {
  role: string;
  assignee: Principal;
}

export interface Event {
  id: bigint;
  title: string;
  description?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  startTime: bigint;
  endTime: bigint;
  clubId: bigint | null;
  teamId: bigint | null;
  recurrenceRule?: RecurrenceRule | null;
  eventType: EventType;
  dutyRoster: DutyAssignment[];
}

export interface TeamMembership {
  user: Principal;
  roles: TeamRole[];
}

export interface ClubMembership {
  user: Principal;
  roles: ClubRole[];
}

export interface Notification {
  id: bigint;
  kind: string;
  createdAt: bigint;
  read: boolean;
  data?: unknown;
}

export interface BackendCommentReaction {
  commentId: bigint;
  user: Principal;
  reactionType: string;
  timestamp: bigint; // ns on backend
}

export type ShoppingItem = { priceId: string; quantity: number };

/* ---------------------------- Backend actor API --------------------------- */

export interface BackendActor {
  // Users / auth
  isCallerAdmin(): Promise<boolean>;
  getCallerUserProfile(): Promise<UserProfile | null>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;

  // Orgs
  getAllClubs(): Promise<Club[]>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByClubId(clubId: bigint): Promise<Team[]>;

  // Memberships
  getClubMembershipsByClub(clubId: bigint): Promise<ClubMembership[]>;
  getTeamMembershipsByTeam(teamId: bigint): Promise<TeamMembership[]>;
  addTeamMembership(teamId: bigint, roles: TeamRole[]): Promise<TeamMembership>;
  removeTeamMember(teamId: bigint, user: Principal): Promise<void>;
  removeTeamRole(teamId: bigint, user: Principal, role: TeamRole): Promise<void>;
  manageTeamRoles(teamId: bigint, user: Principal, roles: TeamRole[]): Promise<void>;
  addClubMembership(clubId: bigint, roles: ClubRole[]): Promise<ClubMembership>;

  // Messages / events
  getAllMessages(): Promise<Message[]>;
  getAllEvents(): Promise<Event[]>;

  // Announcements – comment reactions
  getCommentReactions(commentId: bigint): Promise<BackendCommentReaction[]>;
  addCommentReaction(commentId: bigint, reactionType: string): Promise<boolean>;

  // Stripe Checkout
  createCheckoutSession(
    items: ShoppingItem[],
    successUrl: string,
    cancelUrl: string
  ): Promise<string>; // JSON string of { id, url }
}

export type backendInterface = BackendActor;
export type BackendInterface = BackendActor;

/* ------------------------------ Actor factory ----------------------------- */
export function createActor(): BackendActor {
  const trap = (_: unknown, prop: PropertyKey) => {
    return () => {
      throw new Error(
        `Backend actor method "${String(
          prop
        )}" was called, but no canister bindings are wired.`
      );
    };
  };
  return new Proxy({} as BackendActor, { get: trap });
}