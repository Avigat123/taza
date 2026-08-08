import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function PageContainer({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Navbar title={title} subtitle={subtitle} />
        <main className="p-6 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
