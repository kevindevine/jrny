import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.redirect("https://www.strava.com/oauth/authorize?client_id=166639&redirect_uri=https://jrny-isxg31ac6-kevin-devines-projects.vercel.app/api/auth/strava/callback&response_type=code&scope=read,activity:read_all");
}
