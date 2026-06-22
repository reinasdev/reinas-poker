import { NextResponse } from "next/server";import { logout } from "@/application/auth";import { apiError,assertSameOrigin } from "@/app/api/_shared";
export async function POST(request:Request){try{assertSameOrigin(request);await logout();return NextResponse.json({ok:true})}catch(e){return apiError(e)}}
