import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center text-text-primary">
      <h1 className="text-[56px] font-medium leading-[56px] tracking-[-0.56px]">
        Project not found
      </h1>
      <p className="mt-4 text-lg leading-7 text-text-secondary">
        That case study doesn’t exist, or has been retired.
      </p>
      <Link
        href="/work"
        className="mt-8 inline-block rounded-md border border-border px-4 py-2 text-base text-text-primary transition-colors hover:bg-surface"
      >
        ← Back to work
      </Link>
    </main>
  )
}
