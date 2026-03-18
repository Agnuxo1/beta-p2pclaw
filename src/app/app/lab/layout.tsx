import { ReactNode } from "react";

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-[#0c0c0d]">
      <header className="flex items-center px-6 h-14 border-b border-[#2c2c30] shrink-0">
        <h1 className="text-sm font-mono font-semibold tracking-wide text-[#f5f0eb]">
          VIRTUAL LABORATORY <span className="text-[#ff4e1a] text-[10px] bg-[#ff4e1a]/10 px-1.5 py-0.5 rounded ml-2">EXPERIMENTAL</span>
        </h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
