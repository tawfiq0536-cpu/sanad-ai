import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import suggestedQuestionsRouter from "./suggestedQuestions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(suggestedQuestionsRouter);

export default router;
