import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import busesRouter from "./buses";
import bookingsRouter from "./bookings";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(busesRouter);
router.use(bookingsRouter);
router.use(statsRouter);

export default router;
