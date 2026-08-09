import { useTranslation } from "react-i18next";
import PageContainer from "../components/layout/PageContainer";
import ChatWindow from "../components/agent/ChatWindow";

export default function Agent() {
  const { t } = useTranslation();
  return (
    <PageContainer title={t("agent.title")} subtitle={t("agent.subtitle")}>
      <div className="max-w-2xl">
        <ChatWindow />
      </div>
    </PageContainer>
  );
}
