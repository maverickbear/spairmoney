import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * GET /api/v2/admin/docs?path=APP_OVERVIEW.md | path=features/AUTH.md | path=LANDING_VS_FEATURES.md
 * Returns raw markdown content for a doc file. Admin-only (super_admin).
 * Path must be under docs/ (no path traversal). Allowed: APP_OVERVIEW.md, LANDING_VS_FEATURES.md, PRODUCTION.md, features/UPPER_SNAKE_CASE.md.
 * When adding a new doc, update ALLOWED_PATH_REGEX if the path pattern changes; see docs/APP_OVERVIEW.md "Keeping /admin/docs in sync".
 */
const ALLOWED_PATH_REGEX = /^(?:APP_OVERVIEW\.md|LANDING_VS_FEATURES\.md|PRODUCTION\.md|features\/[A-Z0-9_]+\.md)$/;

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminService = makeAdminService();
    if (!(await adminService.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Forbidden: admin only" },
        { status: 403 }
      );
    }

    const pathParam = request.nextUrl.searchParams.get("path");
    if (!pathParam || !ALLOWED_PATH_REGEX.test(pathParam)) {
      return NextResponse.json(
        { error: "Invalid or missing path parameter" },
        { status: 400 }
      );
    }

    const docsDir = join(process.cwd(), "docs");
    const filePath = join(docsDir, pathParam);

    if (!filePath.startsWith(docsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    console.error("Error reading docs:", error);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load document" },
      { status: 500 }
    );
  }
}
