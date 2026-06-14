import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"])

export const proxy = clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect()
})

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
}
