import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocUpload } from "@/components/docs/DocUpload";

export default function ChatWorkspace() {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[300px_1fr]">
      <aside className="hidden min-h-0 flex-col border-r border-line bg-paper-2/50 md:flex">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Your documents
          </h2>
        </div>
        <DocUpload />
      </aside>
      <ChatPanel />
    </div>
  );
}
