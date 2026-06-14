import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Developer&apos;s Market</h1>
          <p className="text-zinc-500 text-sm mt-1">Client Portal</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
