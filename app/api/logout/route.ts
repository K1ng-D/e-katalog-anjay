// app/api/logout/route.ts -- simple logout endpoint
import { NextResponse } from 'next/server'

export async function POST() {
// Client must call signOut(auth) directly; API route is placeholder if you later add server actions
return NextResponse.json({ ok: true })
}