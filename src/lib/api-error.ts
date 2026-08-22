import { NextResponse } from "next/server";

export class UnauthorizedError extends Error {}

export function routeError(error: unknown, fallback: string) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
