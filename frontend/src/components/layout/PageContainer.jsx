import { useEffect } from "react";
import AnimatedPage from "./AnimatedPage";
import { usePageHeader } from "../../context/PageHeaderContext";

export default function PageContainer({ title, subtitle, children }) {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader(title, subtitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, subtitle]);

  return <AnimatedPage>{children}</AnimatedPage>;
}
