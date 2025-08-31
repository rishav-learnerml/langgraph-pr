import React from "react";
import SkeletonLoader from "@/utils/shimmer/SkeletonLoader";

const ChatPageSkeleton: React.FC = () => {
  return (
    <div className="relative flex flex-col h-[78vh] overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 pb-2 border-b border-border backdrop-blur-md bg-background/80">
        <div className="flex items-center gap-3">
          <SkeletonLoader className="h-6 w-6 rounded-full" />
          <SkeletonLoader className="h-6 w-48" />
        </div>
        <SkeletonLoader className="h-8 w-8 rounded-full" />
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
          <SkeletonLoader className="h-14 w-14 rounded-full" />
          <SkeletonLoader className="h-6 w-64" />
          <SkeletonLoader className="h-4 w-48" />
        </div>
      </main>

      {/* Input Dock */}
      <div className="sticky bottom-0 z-20 p-4 border-t border-border bg-background/80 backdrop-blur-md flex items-center gap-2">
        <SkeletonLoader className="flex-1 h-10 rounded-lg" />
        <SkeletonLoader className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
};

export default ChatPageSkeleton;
