import { useUser as useClerkUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect } from "react";

export function useAuth() {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { isLoaded: clerkLoaded } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const { signOut: clerkSignOut, openSignIn } = useClerk();

  const user = useQuery(api.users.getCurrentUser);
  const upsertUser = useMutation(api.users.upsertUser);

  // Auto-setup user for new users
  useEffect(() => {
    if (isAuthenticated && clerkUser && user === null) {
      // User is authenticated but doesn't exist in Convex yet, create them
      upsertUser({
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName || undefined,
        lastName: clerkUser.lastName || undefined,
        profileImageUrl: clerkUser.imageUrl,
      }).catch(console.error);
    }
  }, [isAuthenticated, clerkUser, user, upsertUser]);

  const isLoading = !clerkLoaded || convexLoading || (isAuthenticated && user === undefined);

  return {
    user,
    isLoading,
    isAuthenticated: isAuthenticated && !!user,
    signIn: openSignIn,
    signOut: () => clerkSignOut(),
  };
}
