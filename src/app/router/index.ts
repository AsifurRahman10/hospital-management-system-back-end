import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.route";
import { AuthRoutes } from "../modules/auth/auth.route";

export const router = Router();

const moduleRouter = [
  {
    path: "/specialty",
    route: specialtyRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
];

moduleRouter.forEach((route) => {
  router.use(route.path, route.route);
});
