import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocUpload } from "@/components/docs/DocUpload";

export default function ChatWorkspace() {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[320px_1fr]">
      <aside className="hidden border-r md:block">
        <DocUpload />
      </aside>
      <ChatPanel />
    </div>
  );
}
