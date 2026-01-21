import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateVendorToken, setVendorCookie } from "@/lib/auth/vendor";

const loginSchema = z.object({
  token: z.string().min(32, "Invalid token"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = loginSchema.parse(body);

    const vendor = await validateVendorToken(token);

    if (!vendor) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (!vendor.isActive) {
      return NextResponse.json(
        { error: "Vendor account is not active" },
        { status: 403 }
      );
    }

    // Set the session cookie
    await setVendorCookie(token, vendor.id);

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        company: vendor.company,
        specialty: vendor.specialty,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Vendor login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
