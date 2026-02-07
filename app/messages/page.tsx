import AutoRefresh from "./AutoRefresh";
import LiveMessagesSection from "@/components/messages/LiveMessagesSection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fde9e1_0%,#f7eee9_40%,#f2e7e1_100%)] p-4 md:p-8">
      <AutoRefresh />
      <div className="mx-auto max-w-[1600px]">
        <LiveMessagesSection showHeader />
      </div>
    </main>
  );
}
