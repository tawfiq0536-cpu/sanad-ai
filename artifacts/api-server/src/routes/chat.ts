import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import {
  searchKnowledgeBase,
  formatKnowledgeForPrompt,
  type KnowledgeEntry,
} from "../lib/knowledgeBase";
import { logger } from "../lib/logger";

const router = Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const CHAT_MODE = (process.env.CHAT_MODE || "ai").toLowerCase(); // "ai" = NVIDIA → Gemini → direct Excel fallback, "direct" = direct Excel answers only

let geminiAI: GoogleGenAI | null = null;
let geminiDisabled = false;

function getGeminiAI(): GoogleGenAI | null {
  if (geminiDisabled) return null;
  if (!geminiAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.trim().length === 0) {
      geminiDisabled = true;
      console.warn(
        "⚠️ GEMINI_API_KEY غير مضبوط. سيتم تخطي Gemini واستخدام البديل إن وُجد.",
      );
      return null;
    }
    geminiAI = new GoogleGenAI({ apiKey: key });
  }
  return geminiAI;
}

function buildDirectAnswer(
  message: string,
  entries: KnowledgeEntry[],
): { answer: string; source: string | null } | null {
  if (entries.length === 0) return null;

  const top = entries[0];
  const source = top.source;
  const references = entries
    .slice(0, 3)
    .map(
      (e) =>
        `- ${e.article && e.article !== "عام" ? `[${e.article}] ` : ""}${e.content.slice(0, 240)}${e.content.length > 240 ? "…" : ""}${e.section ? ` (القسم: ${e.section})` : ""}`,
    )
    .join("\n");

  const answer = `وجدت في قاعدة المعرفة ما يتعلق بسؤالك:\n\n${references}\n\n📎 المرجع: ${source}`;
  return { answer, source };
}

/**
 * يستخرج اسم المرجع من الإجابة النصية مع تحمّل تنسيق Markdown.
 * يبحث عن السطر الذي يحتوي على كلمة "المرجع" أو إيموجي 📎 ثم ينظّفه.
 */
function extractSource(answer: string): string | null {
  const lines = answer.split("\n");
  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/\s+/g, " ");
    if (normalized.includes("المرجع") || normalized.includes("📎")) {
      const cleaned = line
        .replace(/\*\*/g, "")
        .replace(/_/g, "")
        .replace(/[📎]/g, "")
        .replace(/المرجع\s*[:]/gi, "")
        .trim();
      if (!cleaned) continue;
      // أخذ اسم الوثيقة فقط قبل أي فاصل إضافي (|، -، ،)
      const source = cleaned.split(/\s*[|\-،,]\s*/)[0].trim();
      return source || cleaned;
    }
  }
  return null;
}

const systemInstruction = `أنت مساعد ذكي متخصص في الأنظمة واللوائح الرسمية وإجابة استفسارات المستفيدين لإمارة منطقة المدينة المنورة.

تعليمات صارمة:
1. أجب باللغة العربية الفصحى المباشرة والدقيقة.
2. أجب بناءً على المعلومات المتاحة في قاعدة المعرفة المقدمة لك.
3. نسّق الإجابة بشكل واصل ومفهوم. إذا كان النص مادة قانونية، استخدم الترتيب التالي:
   - نص المادة / الإجابة: اكتب هنا الشرح أو النص
   - رقم المادة / الرقم: اكتب هنا الرقم إن وُجد
   - 📎 المرجع: اكتب هنا اسم الوثيقة فقط
4. لا تستخدم علامات Markdown نجمية (**) حول عنوان المرجع أو قيمته.
5. إذا لم تجد الإجابة في قاعدة المعرفة، قل: "لا تتوفر لديّ معلومات عن هذا الموضوع في الوثائق المتاحة."`;

function buildGeminiContents(
  knowledgeText: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
): any[] {
  const contents: any[] = [];

  contents.push({
    role: "user",
    parts: [
      {
        text: `${systemInstruction}\n\n[قاعدة المعرفة المستخرجة المتاحة للسؤال]:\n${knowledgeText}`,
      },
    ],
  });

  contents.push({
    role: "model",
    parts: [
      {
        text: "مرحباً بك. أنا جاهز للإجابة بدقة وبنية واضحة بناءً على الوثائق الرسمية وقاعدة المعرفة المتاحة.",
      },
    ],
  });

  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    contents.push({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: message.trim() }],
  });

  return contents;
}

function buildNvidiaMessages(
  knowledgeText: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
): any[] {
  const messages = [
    {
      role: "system",
      content: `${systemInstruction}\n\n[قاعدة المعرفة المستخرجة المتاحة للسؤال]:\n${knowledgeText}`,
    },
    {
      role: "assistant",
      content:
        "مرحباً بك. أنا جاهز للإجابة بدقة وبنية واضحة بناءً على الوثائق الرسمية وقاعدة المعرفة المتاحة.",
    },
  ];

  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    messages.push({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content,
    });
  }

  messages.push({ role: "user", content: message.trim() });

  return messages;
}

async function callGemini(contents: any[]): Promise<string | null> {
  const ai = getGeminiAI();
  if (!ai) return null;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });

  return response.text ?? null;
}

async function callNvidia(
  messages: any[],
  attempt = 1,
): Promise<string | null> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key || key.trim().length === 0) return null;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    // أخطاء 5xx غالباً عابرة، نعيد المحاولة مرتين بفاصل متزايد
    if (response.status >= 500 && response.status < 600 && attempt < 3) {
      console.warn(
        `⚠️ NVIDIA API error ${response.status} (attempt ${attempt}), retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      return callNvidia(messages, attempt + 1);
    }
    throw new Error(`NVIDIA API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content ?? null;
}

router.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "الرجاء إدخال سؤال صحيح." });
    return;
  }

  // 1. البحث عن أفضل 15 نتيجة مطابقة للسؤال من قاعدة المعرفة لتجنب الضغط على النموذج
  const matchedEntries = searchKnowledgeBase(message, 15);

  if (matchedEntries.length === 0) {
    res.json({
      answer: "لا تتوفر لديّ معلومات عن هذا الموضوع في الوثائق المتاحة.",
      source: null,
    });
    return;
  }

  const knowledgeText = formatKnowledgeForPrompt(matchedEntries);

  // 2. الوضع المباشر: إرجاع النتيجة كما هي من ملفات قاعدة المعرفة
  if (CHAT_MODE === "direct") {
    const directAnswer = buildDirectAnswer(message, matchedEntries);
    if (directAnswer) {
      res.json({ answer: directAnswer.answer, source: directAnswer.source });
      return;
    }
    res.json({
      answer: "لا تتوفر لديّ معلومات عن هذا الموضوع في الوثائق المتاحة.",
      source: null,
    });
    return;
  }

  try {
    let answer: string | null = null;

    // 3. محاولة استدعاء NVIDIA NIM أولاً (المفتاح المتاح حالياً)
    try {
      const nvidiaMessages = buildNvidiaMessages(
        knowledgeText,
        message,
        history,
      );
      const nvidiaAnswer = await callNvidia(nvidiaMessages);
      if (nvidiaAnswer) {
        answer = nvidiaAnswer;
      }
    } catch (err: any) {
      console.warn("⚠️ NVIDIA failed:", err.message || err);
      if (logger && logger.warn) logger.warn({ err }, "NVIDIA call failed");
    }

    // 4. إذا فشل NVIDIA، نجرب Gemini
    if (!answer) {
      try {
        const geminiContents = buildGeminiContents(
          knowledgeText,
          message,
          history,
        );
        const geminiAnswer = await callGemini(geminiContents);
        if (geminiAnswer) {
          answer = geminiAnswer;
        }
      } catch (err: any) {
        console.warn("⚠️ Gemini failed:", err.message || err);
        if (logger && logger.warn) logger.warn({ err }, "Gemini call failed");
      }
    }

    if (answer) {
      // استخراج المرجع إن أمكن
      const source = extractSource(answer) || matchedEntries[0].source;

      res.json({ answer, source });
      return;
    }

    // 5. إذا فشلت جميع مزودي الذكاء الاصطناعي، نرجع أفضل مطابقة من الملفات مباشرة
    const fallback = buildDirectAnswer(message, matchedEntries);
    if (fallback) {
      res.json({
        ...fallback,
        warning:
          "NVIDIA غير متاح حالياً، لذا تم إرجاع النتيجة مباشرة من ملفات قاعدة المعرفة.",
      });
      return;
    }

    throw new Error("All AI providers failed");
  } catch (err: any) {
    console.error("❌ AI providers failed:", err);
    if (logger && logger.error) {
      logger.error({ err }, "Chat route error");
    }

    res.status(500).json({
      error: "حدث خطأ في معالجة طلبك. الرجاء المحاولة مرة أخرى.",
      details: err?.message || String(err),
    });
  }
});

export default router;
