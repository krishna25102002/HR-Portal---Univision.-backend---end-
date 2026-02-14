import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import extractResumeText from "../utils/resumeExtractor.js";
import { ai } from "../config/gemini.js";
import { parseResume } from "../services/documentAI.js";

/* ================= AI FIELD EXTRACTION ================= */

function normalizePointsToNumbered(text) {
  if (!text) return "";

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  let count = 1;

  return lines
    .map(line => {
      // 🔥 REMOVE ALL BULLET / GARBAGE PREFIXES COMPLETELY
      const cleaned = line
        .replace(/^[^a-zA-Z0-9]+/g, "")  // remove any non-text prefix
        .replace(/\s+/g, " ")
        .trim();

      return `${count++}. ${cleaned}`;
    })
    .join("\n");
}


async function extractFieldsWithAI(resumeText) {
  const prompt = `
Extract resume details.

Return ONLY JSON:
{
  "name": "",
  "role": "",
  "total_experience": "",
  "objective": "",
  "professional_summary": "",
  "work_experience": "",
  "projects": "",
  "education": ""
}

RESUME TEXT:
${resumeText}
`;

  const result = await ai.generateContent(prompt);
  return extractJSON(result.response.text());
}

/* ================= STEP 1: UPLOAD & EXTRACT ================= */

// export const convertResumeFormatController = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Resume file missing" });
//     }

//     const buffer = fs.readFileSync(req.file.path);
//     const resumeText = await extractResumeText(buffer);
//     const fields = await extractFieldsWithAI(resumeText);

//     res.json({ success: true, fields });
//   } catch (err) {
//     console.error("Resume extraction error:", err);
//     res.status(500).json({ error: "Resume extraction failed" });
//   }
// };
export const convertResumeFormatController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Resume file missing" });
    }

    // ✅ FIX HERE
    const buffer = req.file.buffer;

    const resumeText = await extractResumeText(buffer);
    const fields = await extractFieldsWithAI(resumeText);

    res.json({ success: true, fields });

  } catch (err) {
    console.error("Resume extraction error:", err);
    res.status(500).json({ error: "Resume extraction failed" });
  }
};

/* ================= STEP 2: STREAM PDF WITH LOGO ================= */

export const generateFormattedResumePDF = async (req, res) => {
  try {
    const data = req.body;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Resume.pdf"
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // ✅ COMPANY LOGO PATH (YOUR EXACT PATH)
    const logoPath = path.join(
      process.cwd(),
      "src",
      "assest",
      "logo.png"
    );

    const drawHeader = () => {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width - 150, 20, { width: 110 });
      }
      doc.moveDown(3);
    };

    // Logo on first page
    drawHeader();

    // Logo on every new page
    doc.on("pageAdded", drawHeader);

    /* ===== CONTENT ===== */

    doc.fontSize(18).font("Helvetica-Bold").text(data.name || "");
    doc.fontSize(14).font("Helvetica").text(data.role || "");
    doc.fontSize(12).text(`Total Experience: ${data.total_experience || ""}`);
    doc.moveDown();

    section(doc, "Objective", data.objective);
    // section(doc, "Professional Summary", data.professional_summary);
    // section(doc, "Work Experience", data.work_experience);
    // section(doc, "Projects", data.projects);
    section(doc, "Education", data.education);
      section(doc, "Professional Summary",
  normalizePointsToNumbered(data.professional_summary)
);

section(doc, "Work Experience",
  normalizePointsToNumbered(data.work_experience)
);

section(doc, "Projects",
  normalizePointsToNumbered(data.projects)
);

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "PDF generation failed" });
  }
};

/* ================= HELPERS ================= */

function section(doc, title, content) {
  doc.fontSize(13).font("Helvetica-Bold").text(title);
  doc.font("Helvetica").fontSize(12).text(content || "-");
  doc.moveDown();
}

function extractJSON(text) {
  if (!text) throw new Error("Empty AI response");

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Invalid JSON from AI");
  }

  return JSON.parse(cleaned.substring(start, end + 1));
}

/* ================= OTHER EXISTING FEATURES (UNCHANGED) ================= */
export const parseResumeController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Resume file missing" });
    }

    // 🔥 IMPORTANT CHANGE
    const parsedData = await parseResume(
      req.file.buffer,
      req.file.mimetype
    );

    res.json(parsedData);

  } catch (err) {
    console.error("Resume parsing error:", err);
    res.status(500).json({ error: "Resume parsing failed" });
  }
};

// export const parseResumeController = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Resume file missing" });
//     }
//     const parsedData = await parseResume(req.file.path);
//     res.json(parsedData);
//   } catch (err) {
//     console.error("Resume parsing error:", err);
//     res.status(500).json({ error: "Resume parsing failed" });
//   }
// };

export const analyzeResumeForJD = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        error: "resumeText and jobDescription are required",
      });
    }

    const prompt = `
Return ONLY JSON:
{
  "matchScore": 0,
  "strengths": [],
  "missingSkills": [],
  "recommendation": ""
}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}
`;

    const result = await ai.generateContent(prompt);
    const analysis = extractJSON(result.response.text());

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("Resume analysis error:", err.message);
    res.status(500).json({ error: "Resume analysis failed" });
  }
};

export const getJDSuggestionsForResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ error: "jobDescription is required" });
    }

    const prompt = `
Return ONLY JSON:
{
  "jobTitles": [],
  "primarySkills": [],
  "secondarySkills": [],
  "toolsAndTechnologies": [],
  "booleanSearch": "",
  "naukriTags": []
}

JOB DESCRIPTION:
${jobDescription}
`;

    const result = await ai.generateContent(prompt);
    const suggestions = extractJSON(result.response.text());

    res.json({ success: true, suggestions });
  } catch (err) {
    console.error("JD suggestion error:", err.message);
    res.status(500).json({ error: "JD suggestions failed" });
  }
};

export const getInterviewTips = async (req, res) => {
  try {
    const { position, candidateName } = req.body;

    if (!position) {
      return res.status(400).json({ error: "position is required" });
    }

    const prompt = `
Return ONLY JSON:
{
  "technicalQuestions": [],
  "behavioralQuestions": [],
  "preparationTips": [],
  "whatToExpect": ""
}

Position: ${position}
Candidate: ${candidateName || "Candidate"}
`;

    const result = await ai.generateContent(prompt);
    const tips = extractJSON(result.response.text());

    res.json({ success: true, tips });
  } catch (err) {
    console.error("Interview tips error:", err.message);
    res.status(500).json({ error: "Interview tips failed" });
  }
};
