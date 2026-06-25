import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default function ChatWorkspace() {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[300px_1fr]">
      <aside className="hidden min-h-0 flex-col border-r border-line bg-paper-2/50 md:flex">
        <DocsSidebar />
      </aside>
      <ChatPanel />
    </div>
  );
}
