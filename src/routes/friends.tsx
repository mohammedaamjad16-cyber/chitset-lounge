import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, Inbox, Search, LogIn, Check, X, Clock } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FriendRow } from "@/components/friends/friend-row";
import { FriendSearch } from "@/components/friends/friend-search";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useFriends,
  useFriendRequestCount,
  useFriendRequests,
  useFriendsRealtime,
  useRemoveFriend,
  useRespondToRequest,
} from "@/lib/friends/queries";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends — ChitSet" },
      {
        name: "description",
        content: "Manage your ChitSet friends, respond to requests, and find new players to invite.",
      },
      { property: "og:title", content: "Friends — ChitSet" },
      { property: "og:description", content: "Manage friends and requests on ChitSet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { loading, isGuest } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-14 text-center text-muted-foreground">Loading…</div>;
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6 lg:px-8">
        <EmptyState
          icon={LogIn}
          title="Sign in to see friends"
          description="Create an account or sign in to add friends, send requests, and invite players to your matches."
          actionLabel="Go to sign in"
          onAction={() => {
            window.location.href = "/auth";
          }}
        />
      </div>
    );
  }

  return <FriendsContent />;
}

function FriendsContent() {
  useFriendsRealtime();
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { data: requests, isLoading: requestsLoading } = useFriendRequests();
  const { data: requestCount = 0 } = useFriendRequestCount();
  const removeFriend = useRemoveFriend();
  const respond = useRespondToRequest();

  const incoming = requests?.incoming ?? [];
  const outgoing = requests?.outgoing ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Friends</h1>
          <p className="mt-2 text-muted-foreground">Build your crew and invite them to a match.</p>
        </div>

        <Tabs defaultValue="friends">
          <TabsList className="mx-auto grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Requests
              {requestCount > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                  {requestCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="find">Find players</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-5">
            <GlassCard className="p-4 sm:p-6">
              {friendsLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading friends…</p>
              ) : friends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No friends yet"
                  description="Search for players and send a friend request to get started."
                />
              ) : (
                <div className="space-y-2">
                  {friends.map(({ friendshipId, profile }) => (
                    <FriendRow
                      key={friendshipId}
                      profile={profile}
                      action={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-9 text-muted-foreground hover:text-destructive"
                          disabled={removeFriend.isPending}
                          onClick={() => removeFriend.mutate(friendshipId)}
                        >
                          Remove
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="requests" className="mt-5 space-y-5">
            <GlassCard className="p-4 sm:p-6">
              <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Incoming</h2>
              {requestsLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
              ) : incoming.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No incoming requests"
                  description="When someone sends you a friend request, it'll show up here."
                />
              ) : (
                <div className="space-y-2">
                  {incoming.map(({ friendshipId, profile }) => (
                    <FriendRow
                      key={friendshipId}
                      profile={profile}
                      action={
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="min-h-9 bg-gradient-primary text-primary-foreground"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ friendshipId, action: "accept" })}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-9"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ friendshipId, action: "decline" })}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-4 sm:p-6">
              <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Outgoing</h2>
              {requestsLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
              ) : outgoing.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No outgoing requests"
                  description="Requests you've sent will appear here until they're accepted."
                />
              ) : (
                <div className="space-y-2">
                  {outgoing.map(({ friendshipId, profile }) => (
                    <FriendRow
                      key={friendshipId}
                      profile={profile}
                      action={
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      }
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>

          <TabsContent value="find" className="mt-5">
            <GlassCard className="p-4 sm:p-6">
              <FriendSearch />
            </GlassCard>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
