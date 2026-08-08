import PageContainer from "../components/layout/PageContainer";
import ChatWindow from "../components/agent/ChatWindow";

export default function Agent() {
  return (
    <PageContainer title="Ops agent" subtitle="Ask about inventory, risk, and priorities">
      <div className="max-w-2xl">
        <ChatWindow />
      </div>
    </PageContainer>
  );
}
