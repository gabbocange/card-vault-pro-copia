import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";

/**
 * eBay Marketplace Account Deletion / Closure Notification endpoint.
 *
 * Configure in eBay Developer portal:
 *   Endpoint URL: https://<your-domain>/api/public/ebay/deletion
 *   Verification token: value of EBAY_DELETION_VERIFICATION_TOKEN secret
 *
 * GET  → eBay sends ?challenge_code=... and expects a JSON body with
 *        challengeResponse = sha256(challengeCode + verificationToken + endpointURL)
 * POST → eBay sends a notification payload. We acknowledge with 200.
 *        We don't store any eBay user data, so there is nothing to delete.
 */
export const Route = createFileRoute("/api/public/ebay/deletion")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const challengeCode = url.searchParams.get("challenge_code");
        const verificationToken = process.env.EBAY_DELETION_VERIFICATION_TOKEN;

        if (!challengeCode || !verificationToken) {
          return new Response("Missing challenge_code or verification token", {
            status: 400,
          });
        }

        const endpointURL = `${url.origin}${url.pathname}`;
        const hash = crypto
          .createHash("sha256")
          .update(challengeCode)
          .update(verificationToken)
          .update(endpointURL)
          .digest("hex");

        return Response.json({ challengeResponse: hash });
      },
      POST: async () => {
        // We do not store eBay user data; nothing to delete.
        return new Response(null, { status: 200 });
      },
    },
  },
});
