import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PrismaSchemaForm from "./pages/PrismaSchemaForm.tsx";
import PrismaNestDto from "./pages/PrismaNestDto.tsx";
import Layout from "./layout.tsx";
import RjsfTable from "./pages/RjsfTable.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <PrismaSchemaForm />,
      },
      {
        path: "prisma-nest-dto",
        element: <PrismaNestDto />,
      },
      {
        path: "rjsf-table",
        element: <RjsfTable />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
