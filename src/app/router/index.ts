import { Router } from "express";
import { specialtyRoutes } from "../modules/specialty/specialty.route";

export const router = Router();

const moduleRouter = [
  {
    path: "/specialty",
    route: specialtyRoutes,
  },
];

moduleRouter.forEach((route) => {
  router.use(route.path, route.route);
});
