import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vendorsRouter from "./vendors";
import menuItemsRouter from "./menuItems";
import ordersRouter from "./orders";
import tablesRouter from "./tables";
import configRouter from "./config";
import mainDishesRouter from "./mainDishes";
import mainDishTypesRouter from "./mainDishTypes";
import sideItemsRouter from "./sideItems";
import proteinItemsRouter from "./proteinItems";
import dishConfigsRouter from "./dishConfigs";
import authRouter from "./auth";
import vendorDashboardRouter from "./vendor-dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vendorsRouter);
router.use(menuItemsRouter);
router.use(ordersRouter);
router.use(tablesRouter);
router.use(configRouter);
router.use(mainDishesRouter);
router.use(mainDishTypesRouter);
router.use(sideItemsRouter);
router.use(proteinItemsRouter);
router.use(dishConfigsRouter);
router.use(authRouter);
router.use(vendorDashboardRouter);

export default router;
