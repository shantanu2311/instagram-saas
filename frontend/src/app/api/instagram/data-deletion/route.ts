import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Instagram Data Deletion Request Callback
 *
 * Meta sends a POST request to this URL when a user requests deletion
 * of their data from the Facebook/Instagram "Apps and Websites" settings.
 *
 * Required by Meta for App Review.
 *
 * The request body contains a signed_request (base64url-encoded JSON
 * signed with the app secret).
 *
 * We must return a JSON response with:
 * - url: A URL where the user can check the status of their deletion request
 * - confirmation_code: A unique code for this deletion request
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
      console.warn("Data deletion: Invalid signature");
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

    console.log("Data deletion request received for Facebook user:", userId);

    // Generate a unique confirmation code
    const confirmationCode = `DEL-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}`;

    // In a production app, you would:
    // 1. Look up the user by their Facebook user ID
    // 2. Queue a background job to delete all their data
    // 3. Store the confirmation code for status tracking
    //
    // For now, since Instagram tokens are stored in cookies (not server-side),
    // there's no server-side data to delete beyond what's in the database.
    // The cookie is automatically cleared when the user disconnects.

    // Auto-detect base URL
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "kuraite.co.in";
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;

    return NextResponse.json({
      url: `${baseUrl}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error("Data deletion callback error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking deletion status.
 * Meta may also ping this to verify the URL is valid.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Data deletion endpoint is active.",
  });
}
