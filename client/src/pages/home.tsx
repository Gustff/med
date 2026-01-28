import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="absolute top-3 right-3 z-10">
        <ThemeToggle />
      </div>
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}
