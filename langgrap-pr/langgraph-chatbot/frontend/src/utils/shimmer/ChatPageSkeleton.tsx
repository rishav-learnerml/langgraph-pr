import React from "react";
import SkeletonLoader from "@/utils/shimmer/SkeletonLoader";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ChatPageSkeleton: React.FC = () => {
  return (
    <Card className="w-full max-w-2xl mx-auto flex flex-col h-[80vh]">
      <CardHeader>
        <CardTitle className="text-white">
          <SkeletonLoader className="h-8 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex flex-col gap-2">
        <div className="flex justify-start">
          <SkeletonLoader className="h-10 w-3/4" />
        </div>
        <div className="flex justify-end">
          <SkeletonLoader className="h-10 w-2/3" />
        </div>
        <div className="flex justify-start">
          <SkeletonLoader className="h-10 w-1/2" />
        </div>
        <div className="flex justify-end">
          <SkeletonLoader className="h-10 w-3/4" />
        </div>
      </CardContent>
      <CardFooter className="flex p-4 border-t border-gray-700">
        <SkeletonLoader className="flex-1 h-10 mr-2" />
        <SkeletonLoader className="h-10 w-20" />
      </CardFooter>
    </Card>
  );
};

export default ChatPageSkeleton;
