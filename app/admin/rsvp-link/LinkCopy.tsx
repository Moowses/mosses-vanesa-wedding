"use client";

export default function LinkCopy({ link }: { link: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(link)}
      className="px-2 py-1 text-xs rounded bg-black text-white hover:opacity-80"
    >
      Copy
    </button>
  );
}
