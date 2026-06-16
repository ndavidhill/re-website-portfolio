import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Dev-only: receives the element picked in the Claude Inspector overlay and
// writes it to .claude/selection.json so Claude can read exactly what you
// selected. Disabled outside development.
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev only" }, { status: 404 });
  }
  try {
    const data = await req.json();
    const dir = path.join(process.cwd(), ".claude");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, "selection.json"),
      JSON.stringify(data, null, 2),
    );
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
