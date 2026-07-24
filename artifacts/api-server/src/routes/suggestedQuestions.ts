import { Router } from "express";
import { getSuggestedQuestions } from "../lib/knowledgeBase";

const router = Router();

router.get("/suggested-questions", (_req, res) => {
  try {
    const questions = getSuggestedQuestions(6);
    res.json({ questions });
  } catch (err) {
    console.error("❌ Error fetching suggested questions:", err);
    res.status(500).json({
      error: "حدث خطأ في جلب الأسئلة المقترحة.",
      questions: [],
    });
  }
});

export default router;
