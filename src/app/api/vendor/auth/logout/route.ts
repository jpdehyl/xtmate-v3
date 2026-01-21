import { NextResponse } from "next/server";
import { clearVendorCookies } from "@/lib/auth/vendor";

export async function POST() {
  try {
    await clearVendorCookies();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vendor logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
