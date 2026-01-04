"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Debug action to check what Clerk has for a user's Google OAuth
export const checkGoogleOAuth = action({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY not configured");
    }

    // 1. Get user info from Clerk
    const userResponse = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkUserId}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (!userResponse.ok) {
      const error = await userResponse.text();
      throw new Error(`Failed to get user: ${error}`);
    }

    const userData = await userResponse.json();

    // 2. Check external accounts
    const externalAccounts = userData.external_accounts || [];
    const googleAccount = externalAccounts.find(
      (acc: any) => acc.provider === "oauth_google" || acc.provider === "google"
    );

    // 3. Try to get OAuth token
    let tokenInfo = null;
    let tokenError = null;

    // Try different provider names
    const providerNames = ["oauth_google", "google"];

    for (const provider of providerNames) {
      try {
        const tokenResponse = await fetch(
          `https://api.clerk.com/v1/users/${args.clerkUserId}/oauth_access_tokens/${provider}`,
          {
            headers: {
              Authorization: `Bearer ${clerkSecretKey}`,
            },
          }
        );

        const responseText = await tokenResponse.text();
        console.log(`Token response for ${provider}:`, tokenResponse.status, responseText);

        if (tokenResponse.ok) {
          tokenInfo = {
            provider,
            status: tokenResponse.status,
            data: JSON.parse(responseText),
          };
          break;
        } else {
          tokenError = {
            provider,
            status: tokenResponse.status,
            error: responseText,
          };
        }
      } catch (e) {
        tokenError = {
          provider,
          error: String(e),
        };
      }
    }

    return {
      userId: args.clerkUserId,
      hasGoogleAccount: !!googleAccount,
      googleAccountInfo: googleAccount ? {
        provider: googleAccount.provider,
        emailAddress: googleAccount.email_address,
        approvedScopes: googleAccount.approved_scopes,
        publicMetadata: googleAccount.public_metadata,
      } : null,
      allExternalAccounts: externalAccounts.map((acc: any) => ({
        provider: acc.provider,
        email: acc.email_address,
        approvedScopes: acc.approved_scopes,
      })),
      tokenInfo,
      tokenError,
    };
  },
});
