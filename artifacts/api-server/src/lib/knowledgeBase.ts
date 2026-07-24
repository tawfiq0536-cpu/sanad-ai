import XLSX from "xlsx";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, parse } from "path";

declare const __dirname: string;

const DATA_DIR = (() => {
  // __dirname مضبوط تلقائياً عند البناء (build.mjs banner) ليشير إلى مجلد الملف المنفذ
  const buildDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

  const candidates = [
    join(buildDir, "../src/data"), // عند التشغيل من artifacts/api-server/dist/
    join(buildDir, "src/data"),    // عند التشغيل من artifacts/api-server/
    join(process.cwd(), "src/data"), // للتوافق مع السلوك القديم
    join(process.cwd(), "artifacts/api-server/src/data"), // عند التشغيل من جذر المشروع
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return candidates[0];
})();

export interface KnowledgeEntry {
  source: string;
  article: string;
  content: string;
  section?: string;
  notes?: string;
}

let _knowledgeBase: KnowledgeEntry[] | null = null;

function normalizeHeader(value: any): string {
  if (!value) return "";
  return value.toString().replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * يُحسّن مطابقة النص العربي بتوحيد الأحرف المشكلة والمتشابهة.
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // إزالة التشكيل
    .replace(/[إأآا]/g, "ا") // توحيد الألف
    .replace(/ى/g, "ي") // توحيد الألف المقصورة
    .replace(/ة/g, "ه") // توحيد التاء المربوطة
    .replace(/ؤ/g, "و") // همزة على واو
    .replace(/ئ/g, "ي") // همزة على ياء
    .replace(/[\u200C-\u200F]/g, "") // إزالة أحرف التحكم
    .trim();
}

function detectColumnMapping(rows: Record<string, any>[]): {
  articleKey: string | null;
  contentKey: string | null;
  sectionKey: string | null;
  notesKey: string | null;
} {
  // قائمة المرشحات لأرقام المواد أو الأسئلة
  const articleCandidates = [
    "المادة",
    "رقم المادة",
    "رقم_المادة",
    "الرقم",
    "مادة",
    "السؤال",
    "سؤال",
    "الاستفسار",
    "استفسار",
  ];

  // قائمة المرشحات للنصوص الإجابات أو تفاصيل المادة
  const contentCandidates = [
    "الإجابة",
    "الاجابة",
    "إجابة",
    "اجابة",
    "النص والتفاصيل",
    "نص المادة النظيف",
    "نص المادة",
    "نص_المادة",
    "النص",
    "التفاصيل",
    "المحتوى",
    "شرح المادة",
    "الفصول والمكونات الرئيسية",
    "المكونات الرئيسية",
    "الفصول",
    "المحتوى الرئيسي",
    "الوصف",
    "التعريف",
  ];

  // قائمة المرشحات للأبواب والأقسام
  const sectionCandidates = [
    "الباب التنظيمي",
    "الباب",
    "القسم",
    "الفصل",
    "التصنيف",
  ];

  // قائمة المرشحات للملاحظات أو التعديلات
  const notesCandidates = [
    "التعديلات والملاحظات",
    "الملاحظات",
    "ملاحظات",
    "تعديلات",
    "توضيح",
  ];

  let mapping = {
    articleKey: null as string | null,
    contentKey: null as string | null,
    sectionKey: null as string | null,
    notesKey: null as string | null,
  };

  if (rows.length === 0) return mapping;

  const firstRow = rows[0];
  const allKeys = Object.keys(firstRow);

  const findKey = (candidates: string[]) => {
    for (const candidate of candidates) {
      const normalizedCandidate = normalizeHeader(candidate);

      // 1. البحث في أسماء الهيدر المباشرة (Key) — تطابق تام
      const keyMatch = allKeys.find(
        (k) => normalizeHeader(k) === normalizedCandidate,
      );
      if (keyMatch) return keyMatch;

      // 2. البحث في قيم الصف الأول (في حال كان الأكسل بدون هيدر والسطر الأول هو العناوين)
      const directMatch = allKeys.find(
        (k) => normalizeHeader(firstRow[k]) === normalizedCandidate,
      );
      if (directMatch) return directMatch;

      // 3. تطابق جزئي في اسم العمود — يساعد مع أسماء الأعمدة المركبة مثل
      //    "الفصول والمكونات الرئيسية" أو "نص المادة والتفاصيل"
      const partialMatch = allKeys.find((k) => {
        const normalizedKey = normalizeHeader(k);
        return (
          normalizedKey.includes(normalizedCandidate) ||
          normalizedCandidate.includes(normalizedKey)
        );
      });
      if (partialMatch) return partialMatch;
    }
    return null;
  };

  mapping.articleKey = findKey(articleCandidates);
  mapping.contentKey = findKey(contentCandidates);
  mapping.sectionKey = findKey(sectionCandidates);
  mapping.notesKey = findKey(notesCandidates);

  // 🛠️ خيار احتياطي (Fallback) في حال عدم التعرف التلقائي:
  // إذا وجدنا أعمدة ولم نحدد النص، نعتبر العمود الأخير أو الثاني هو النص والعمود الأول هو المادة/السؤال
  if (!mapping.contentKey && allKeys.length > 0) {
    if (allKeys.length === 1) {
      mapping.contentKey = allKeys[0];
    } else {
      mapping.articleKey = mapping.articleKey || allKeys[0];
      mapping.contentKey =
        allKeys.find((k) => k !== mapping.articleKey) || allKeys[1];
    }
  }

  return mapping;
}

function loadExcelFile(filePath: string, sourceName: string): KnowledgeEntry[] {
  const workbook = XLSX.read(readFileSync(filePath));
  const entries: KnowledgeEntry[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    if (rawRows.length === 0) continue;

    const { articleKey, contentKey, sectionKey, notesKey } =
      detectColumnMapping(rawRows);

    if (!contentKey) {
      console.warn(`⚠️ تعذر التعرف على عمود النص في ملف: ${sourceName}`);
      continue;
    }

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      const article = (
        articleKey && row[articleKey] !== undefined ? row[articleKey] : ""
      )
        .toString()
        .trim();
      const content = (
        contentKey && row[contentKey] !== undefined ? row[contentKey] : ""
      )
        .toString()
        .trim();
      const section =
        (sectionKey && row[sectionKey] !== undefined ? row[sectionKey] : "")
          .toString()
          .trim() || undefined;
      const notes =
        (notesKey && row[notesKey] !== undefined ? row[notesKey] : "")
          .toString()
          .trim() || undefined;

      // استبعاد أسطر الهيدر المكررة داخل البيانات
      const normalizedContent = normalizeHeader(content);
      const normalizedArticle = normalizeHeader(article);

      const isHeaderRow =
        normalizedContent === "الإجابة" ||
        normalizedContent === "الاجابة" ||
        normalizedContent === "النص والتفاصيل" ||
        normalizedContent === "نص المادة النظيف" ||
        normalizedArticle === "المادة" ||
        normalizedArticle === "الرقم" ||
        normalizedArticle === "السؤال";

      if (content && !isHeaderRow) {
        entries.push({
          source: sourceName,
          article: article || "عام",
          section,
          content,
          notes,
        });
      }
    }
  }

  return entries;
}

export function getSuggestedQuestions(limit: number = 6): string[] {
  if (!existsSync(DATA_DIR)) {
    console.warn(`⚠️ مجلد البيانات غير موجود: ${DATA_DIR}`);
    return [];
  }

  const files = readdirSync(DATA_DIR).filter(
    (file) => file.endsWith(".xlsx") && !file.startsWith("~$"),
  );

  const explicitQuestions: string[] = [];
  const topicSamples: string[] = [];
  const seenQuestions = new Set<string>();
  const seenTopics = new Set<string>();

  for (const file of files) {
    const filePath = join(DATA_DIR, file);
    const sourceName = parse(file).name;

    try {
      const workbook = XLSX.read(readFileSync(filePath));

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
          defval: "",
        });
        if (rawRows.length === 0) continue;

        const { articleKey, contentKey } = detectColumnMapping(rawRows);
        const questionKey =
          Object.keys(rawRows[0]).find(
            (k) => normalizeHeader(k) === "السؤال",
          ) || articleKey;

        // ملفات بصيغة أسئلة/إجابات
        if (questionKey && normalizeHeader(questionKey) === "السؤال") {
          for (const row of rawRows) {
            const q = row[questionKey]?.toString().trim();
            if (!q) continue;
            const normalizedQ = normalizeHeader(q);
            if (
              normalizedQ === "السؤال" ||
              normalizedQ === "الاستفسار" ||
              seenQuestions.has(q)
            )
              continue;
            seenQuestions.add(q);
            explicitQuestions.push(q);
          }
          continue;
        }

        // ملفات بصيغة مواد/أرقام: نستخدم الباب/الفصل أو رقم المادة كعناوين مقترحة
        if (contentKey) {
          const seenSections = new Set<string>();
          for (const row of rawRows.slice(0, 30)) {
            const content = row[contentKey]?.toString().trim();
            if (!content) continue;
            const article = articleKey
              ? row[articleKey]?.toString().trim()
              : "";
            const section = sectionKey
              ? row[sectionKey]?.toString().trim()
              : "";

            let label = "";
            if (section) {
              // تفضيل الباب والفصل لأنه أقرب إلى موضوع سؤال
              const sectionPreview = section.slice(0, 100);
              label = `(${sourceName}) ${sectionPreview}${section.length > 100 ? "…" : ""}`;
              if (seenSections.has(sectionPreview)) continue;
              seenSections.add(sectionPreview);
            } else if (article) {
              // إذا لا يوجد باب/فصل، نستخدم رقم المادة مع بداية النص
              label = `(${sourceName}) المادة ${article}: ${content.slice(0, 70)}${content.length > 70 ? "…" : ""}`;
            } else {
              label = `(${sourceName}) ${content.slice(0, 80)}${content.length > 80 ? "…" : ""}`;
            }

            if (!label || seenTopics.has(label)) continue;
            seenTopics.add(label);
            topicSamples.push(label);
            if (topicSamples.length >= limit * 2) break;
          }
        }
      }
    } catch (err) {
      console.error(`❌ فشل قراءة الأسئلة من الملف ${file}:`, err);
    }
  }

  // دمج: أسئلة من الملفات + نماذج من ملفات المواضيع
  const combined: string[] = [];
  let qIndex = 0;
  let tIndex = 0;
  while (combined.length < limit && (qIndex < explicitQuestions.length || tIndex < topicSamples.length)) {
    if (qIndex < explicitQuestions.length) {
      combined.push(explicitQuestions[qIndex++]);
    }
    if (combined.length < limit && tIndex < topicSamples.length) {
      combined.push(topicSamples[tIndex++]);
    }
  }

  return combined.slice(0, limit);
}

export function getKnowledgeBase(): KnowledgeEntry[] {
  if (_knowledgeBase) return _knowledgeBase;

  const entries: KnowledgeEntry[] = [];

  try {
    if (existsSync(DATA_DIR)) {
      const files = readdirSync(DATA_DIR).filter(
        (file) => file.endsWith(".xlsx") && !file.startsWith("~$"),
      );

      for (const file of files) {
        const filePath = join(DATA_DIR, file);
        const sourceName = parse(file).name;

        try {
          const fileEntries = loadExcelFile(filePath, sourceName);
          entries.push(...fileEntries);
          console.log(`✅ تم تحميل ${fileEntries.length} سجل من ملف: ${file}`);
        } catch (err) {
          console.error(`❌ فشل تحميل الملف ${file}:`, err);
        }
      }
    } else {
      console.warn(`المجلد غير موجود: ${DATA_DIR}`);
    }
  } catch (err) {
    console.error("خطأ في قراءة مجلد data:", err);
  }

  _knowledgeBase = entries;
  return _knowledgeBase;
}

export function formatKnowledgeForPrompt(entries: KnowledgeEntry[]): string {
  return entries
    .map((e) => {
      const parts = [`المصدر: ${e.source}`, `المادة/السؤال: ${e.article}`];
      if (e.section) parts.push(`الباب/القسم: ${e.section}`);
      parts.push(`التفاصيل/الإجابة: ${e.content}`);
      if (e.notes && e.notes !== "نص ثابت" && e.notes.length > 0) {
        parts.push(`ملاحظات: ${e.notes}`);
      }
      return parts.join(" | ");
    })
    .join("\n---\n");
}

export function searchKnowledgeBase(
  query: string,
  topK: number = 25,
): KnowledgeEntry[] {
  const entries = getKnowledgeBase();
  if (!query || query.trim().length === 0) return entries.slice(0, topK);

  const stopWords = new Set([
    "ما", "هي", "هو", "في", "من", "على", "إلى", "عن",
    "الذي", "التي", "أن", "لا", "أو", "و", "أي", "كان",
    "كل", "بعد", "قبل", "بين", "تحت", "فوق", "مع", "ليس",
    "لم", "قد", "هذا", "هذه", "ذلك", "تلك", "علي", "عنه",
    "له", "لهذه", "أريد", "ابغى", "أبغى", "اعرف", "أعرف",
    "سؤالي", "سؤال", "هل", "بكم", "كم", "اين", "أين", "متى",
    "كيف", "لما", "لماذا", "ابي", "ابغي", "أبي", "أبغي",
    "اريد", "إلى", "إلي", "الي", "الى", "فيه", "فية", "عشان",
  ]);

  const normalizedQuery = normalizeArabic(query.toLowerCase());

  // استخراج الكلمات والعبارات المهمة بعد توحيد الأحرف العربية
  const tokens = normalizedQuery
    .replace(/[؟?.,؛؛!]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  const phrases: string[] = [];
  // كلمات منفردة
  phrases.push(...tokens);
  // ثنائيات
  for (let i = 0; i < tokens.length - 1; i++) {
    phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  // ثلاثيات
  for (let i = 0; i < tokens.length - 2; i++) {
    phrases.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
  }

  if (phrases.length === 0) return entries.slice(0, topK);

  const uniquePhrases = [...new Set(phrases)];

  const scored = entries.map((entry) => {
    let score = 0;
    const normalizedArticle = normalizeArabic(entry.article);
    const normalizedSource = normalizeArabic(entry.source);
    const normalizedSection = normalizeArabic(entry.section || "");
    const normalizedContent = normalizeArabic(entry.content);
    const normalizedNotes = normalizeArabic(entry.notes || "");
    const haystack = `${normalizedSource} ${normalizedArticle} ${normalizedSection} ${normalizedContent} ${normalizedNotes}`;

    for (const phrase of uniquePhrases) {
      if (phrase.length === 0) continue;
      if (!haystack.includes(phrase)) continue;

      const phraseLen = phrase.split(/\s+/).length;
      const baseScore = phraseLen >= 3 ? 8 : phraseLen === 2 ? 5 : 2;

      // مطابقة في رقم المادة أو السؤال
      if (normalizedArticle.includes(phrase)) score += baseScore + 6;
      // مطابقة في اسم المصدر
      else if (normalizedSource.includes(phrase)) score += baseScore + 3;
      // مطابقة في الباب/الفصل
      else if (normalizedSection.includes(phrase)) score += baseScore + 2;
      // مطابقة في النص
      else score += baseScore;
    }

    // تعزيز إضافي لو كان السؤال يطابق رقم مادة بالضبط
    const articleNum = parseInt(normalizedQuery, 10);
    if (!Number.isNaN(articleNum) && normalizedArticle === String(articleNum)) {
      score += 20;
    }

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, topK)
    .map((s) => s.entry);
}
