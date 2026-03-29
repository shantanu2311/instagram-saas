import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Instagram Deauthorize Callback
 *
 * Meta sends a POST request to this URL when a user removes ("deauthorizes")
 * the app from their Facebook/Instagram "Apps and Websites" settings.
 *
 * Required by Meta for App Review.
 *
 * When this happens, we should invalidate any stored tokens for that user.
 * Since our tokens are stored in browser cookies (not server-side), the
 * main action is logging the event.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    // Parse the signed request
    const [encodedSig, payload] = signedRequest.split(".");
    const appSecret = process.env.FACEBOOK_APP_SECRET || "";

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("base64url");

    if (encodedSig !== expectedSig) {
      console.warn("Deauthorize: Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // Decode the payload
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    );
    const userId = data.user_id;

    console.log("Deauthorize callback received for Facebook user:", userId);

    // In a production app, you would:
    // 1. Look up the user by their Facebook user ID
    // 2. Invalidate/delete their stored access tokens
    // 3. Mark the Instagram connection as disconnected in your database
    //
    // Since we store tokens in browser cookies, we can't delete them
    // server-side. The token will naturally expire or the user can
    // manually disconnect from the Settings page.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Deauthorize callback error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for Meta to verify the URL is valid.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Deauthorize callback endpoint is active.",
  });
}
