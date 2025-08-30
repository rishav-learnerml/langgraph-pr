import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "@/layout/Layout";
import HomePageSkeleton from "@/utils/shimmer/HomePageSkeleton";
import ChatPageSkeleton from "@/utils/shimmer/ChatPageSkeleton";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));

const AppRoutes = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<HomePageSkeleton />}>
              <HomePage />
            </Suspense>
          ),
        },
        {
          path: "chat",
          element: (
            <Suspense fallback={<ChatPageSkeleton />}>
              <ChatPage />
            </Suspense>
          ),
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default AppRoutes;
