import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FriendRow } from "@/components/friends/friend-row";
import { EmptyState } from "@/components/shared/empty-state";
import { useSearchProfiles, useSendFriendRequest } from "@/lib/friends/queries";

export function FriendSearch() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => setTerm(input), 350);
    return () => clearTimeout(handle);
  }, [input]);

  const { data: results = [], isFetching } = useSearchProfiles(term);
  const sendRequest = useSendFriendRequest();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by username…"
          className="min-h-11 pl-9"
          aria-label="Search players by username"
        />
      </div>

      {term.trim().length < 2 ? (
        <p className="px-1 text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : isFetching ? (
        <p className="px-1 text-sm text-muted-foreground">Searching…</p>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No players found"
          description={`No usernames matching "${term}".`}
        />
      ) : (
        <div className="space-y-2">
          {results.map((profile) => (
            <FriendRow
              key={profile.id}
              profile={profile}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  className="min-h-9"
                  disabled={sendRequest.isPending}
                  onClick={() => sendRequest.mutate(profile.id)}
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
