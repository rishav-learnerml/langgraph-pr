import React from "react";
import SkeletonLoader from "@/utils/shimmer/SkeletonLoader";

const HomePageSkeleton: React.FC = () => {
  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-br from-background via-muted/40 to-background text-foreground transition-colors duration-500">
      {/* Animated Gradient Background */}
      <SkeletonLoader className="absolute inset-0 -z-10 h-full w-full bg-gradient-to-r from-primary/20 via-purple-500/10 to-secondary/20 blur-3xl opacity-50" />

      {/* Floating Blobs */}
      <SkeletonLoader className="absolute top-[-10rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-primary/30 blur-3xl" />
      <SkeletonLoader className="absolute bottom-[-12rem] right-[-12rem] h-[32rem] w-[32rem] rounded-full bg-secondary/30 blur-3xl" />

      {/* Hero Section */}
      <header className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <SkeletonLoader className="h-12 w-3/4 max-w-lg mb-6" />
        <SkeletonLoader className="h-6 w-1/2 max-w-md" />
        <SkeletonLoader className="h-16 w-48 mt-8 rounded-2xl" />
      </header>

      {/* Features Section */}
      <section className="relative py-20 px-6 bg-background/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl shadow-lg border bg-card transition-all"
            >
              <SkeletonLoader className="h-14 w-14 mx-auto mb-5 rounded-full" />
              <SkeletonLoader className="h-6 w-3/4 mx-auto mb-3" />
              <SkeletonLoader className="h-4 w-full" />
              <SkeletonLoader className="h-4 w-5/6 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePageSkeleton;
