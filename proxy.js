import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

function applyHeaders(response, headers) {
  if (!headers) return
  if (typeof headers.forEach === 'function') {
    headers.forEach((value, key) => response.headers.set(key, value))
    return
  }
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
}

export async function proxy(request) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          applyHeaders(response, headers)
        },
      },
    },
  )
  await supabase.auth.getClaims()
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
