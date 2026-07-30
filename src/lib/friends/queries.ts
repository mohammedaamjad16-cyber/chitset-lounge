import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/lib/auth/auth-context";
import { notify } from "@/lib/notify";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile {
  friendshipId: string;
  profile: Profile;
}

const keys = {
  friends: (userId?: string) => ["friends", userId] as const,
  requests: (userId?: string) => ["friend-requests", userId] as const,
  requestCount: (userId?: string) => ["friend-request-count", userId] as const,
  search: (term: string, userId?: string) => ["friend-search", term, userId] as const,
};

async function fetchProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/** Accepted friendships for the current user, joined with the other user's profile. */
export function useFriends() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.friends(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<FriendWithProfile[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      const friendships = (data ?? []) as Friendship[];
      const otherIds = friendships.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
      const profiles = await fetchProfilesByIds(otherIds);
      const byId = new Map(profiles.map((p) => [p.id, p]));
      return friendships
        .map((f) => {
          const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
          const profile = byId.get(otherId);
          return profile ? { friendshipId: f.id, profile } : null;
        })
        .filter((x): x is FriendWithProfile => x !== null);
    },
  });
}

export interface FriendRequest {
  friendshipId: string;
  profile: Profile;
  createdAt: string;
}

/** Incoming and outgoing pending friend requests. */
export function useFriendRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.requests(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> => {
      if (!user) return { incoming: [], outgoing: [] };
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .eq("status", "pending")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      if (error) throw error;
      const rows = (data ?? []) as Friendship[];
      const incomingRows = rows.filter((r) => r.addressee_id === user.id);
      const outgoingRows = rows.filter((r) => r.requester_id === user.id);
      const profiles = await fetchProfilesByIds([
        ...incomingRows.map((r) => r.requester_id),
        ...outgoingRows.map((r) => r.addressee_id),
      ]);
      const byId = new Map(profiles.map((p) => [p.id, p]));
      const incoming = incomingRows
        .map((r) => {
          const profile = byId.get(r.requester_id);
          return profile ? { friendshipId: r.id, profile, createdAt: r.created_at } : null;
        })
        .filter((x): x is FriendRequest => x !== null);
      const outgoing = outgoingRows
        .map((r) => {
          const profile = byId.get(r.addressee_id);
          return profile ? { friendshipId: r.id, profile, createdAt: r.created_at } : null;
        })
        .filter((x): x is FriendRequest => x !== null);
      return { incoming, outgoing };
    },
  });
}

/** Count of incoming pending requests, for a nav badge. */
export function useFriendRequestCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.requestCount(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("addressee_id", user.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Search profiles by username, excluding the current user. */
export function useSearchProfiles(term: string) {
  const { user } = useAuth();
  const trimmed = term.trim();
  return useQuery({
    queryKey: keys.search(trimmed, user?.id),
    enabled: trimmed.length >= 2,
    queryFn: async (): Promise<Profile[]> => {
      let query = supabase.from("profiles").select("*").ilike("username", `%${trimmed}%`).limit(20);
      if (user) query = query.neq("id", user.id);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

function invalidateFriendData(queryClient: ReturnType<typeof useQueryClient>, userId?: string) {
  void queryClient.invalidateQueries({ queryKey: keys.friends(userId) });
  void queryClient.invalidateQueries({ queryKey: keys.requests(userId) });
  void queryClient.invalidateQueries({ queryKey: keys.requestCount(userId) });
}

export function useSendFriendRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!user) throw new Error("Sign in to add friends.");
      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateFriendData(queryClient, user?.id);
      notify.success("Friend request sent");
    },
    onError: (err: unknown) => {
      notify.error("Couldn't send request", err instanceof Error ? err.message : undefined);
    },
  });
}

export function useRespondToRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendshipId, action }: { friendshipId: string; action: "accept" | "decline" }) => {
      if (action === "accept") {
        const { error } = await supabase
          .from("friendships")
          .update({ status: "accepted" })
          .eq("id", friendshipId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
        if (error) throw error;
      }
      return action;
    },
    onSuccess: (action) => {
      invalidateFriendData(queryClient, user?.id);
      notify.success(action === "accept" ? "Friend request accepted" : "Request declined");
    },
    onError: (err: unknown) => {
      notify.error("Couldn't update request", err instanceof Error ? err.message : undefined);
    },
  });
}

export function useRemoveFriend() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateFriendData(queryClient, user?.id);
      notify.success("Friend removed");
    },
    onError: (err: unknown) => {
      notify.error("Couldn't remove friend", err instanceof Error ? err.message : undefined);
    },
  });
}

export function useBlockUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendshipId, userId }: { friendshipId?: string; userId: string }) => {
      if (!user) throw new Error("Sign in required.");
      if (friendshipId) {
        const { error } = await supabase
          .from("friendships")
          .update({ status: "blocked", requester_id: user.id, addressee_id: userId })
          .eq("id", friendshipId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("friendships")
          .insert({ requester_id: user.id, addressee_id: userId, status: "blocked" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateFriendData(queryClient, user?.id);
      notify.success("User blocked");
    },
    onError: (err: unknown) => {
      notify.error("Couldn't block user", err instanceof Error ? err.message : undefined);
    },
  });
}

/** Subscribes to realtime friendship changes affecting the current user and invalidates queries. */
export function useFriendsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`friendships:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `requester_id=eq.${user.id}` },
        () => invalidateFriendData(queryClient, user.id),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships", filter: `addressee_id=eq.${user.id}` },
        () => invalidateFriendData(queryClient, user.id),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
