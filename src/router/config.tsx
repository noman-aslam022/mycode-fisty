import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import FittingRoom from "../pages/fitting-room/page";
import CatalogManager from "../pages/catalog-manager/page";
import AuthPage from "../pages/auth/page";
import AdminPage from "../pages/admin/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/fitting-room",
    element: <FittingRoom />,
  },
  {
    path: "/catalog",
    element: <CatalogManager />,
  },
  {
    path: "/login",
    element: <AuthPage initialMode="login" />,
  },
  {
    path: "/register",
    element: <AuthPage initialMode="register" />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;