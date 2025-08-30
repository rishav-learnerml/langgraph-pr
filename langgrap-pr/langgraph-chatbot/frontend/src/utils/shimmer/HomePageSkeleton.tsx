import React from "react";
import SkeletonLoader from "@/utils/shimmer/SkeletonLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HomePageSkeleton: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto h-[80vh] flex flex-col items-center justify-center p-4">
      <CardHeader>
        <CardTitle className="text-white">
          <SkeletonLoader className="h-8 w-64" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 w-full flex items-center justify-center">
        <SkeletonLoader className="h-6 w-96" />
      </CardContent>
    </Card>
  );
};

export default HomePageSkeleton;
