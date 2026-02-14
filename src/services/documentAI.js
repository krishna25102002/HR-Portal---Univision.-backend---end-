import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import language from "@google-cloud/language";
import mammoth from "mammoth";

const docClient = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  apiEndpoint: "us-documentai.googleapis.com", // change if your processor is in another region
});

const nlpClient = new language.LanguageServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

/**
 * MAIN ENTRY
 */
export async function parseResume(fileBuffer, mimeType) {
  if (!fileBuffer) {
    throw new Error("No file buffer provided");
  }

  let text = "";

  // 🟢 PDF → Use Document AI
  if (mimeType === "application/pdf") {
    text = await parsePDFWithDocumentAI(fileBuffer);
  }

  // 🟢 DOCX → Use Mammoth
  else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    text = result.value;
  }

  // ❌ Unsupported
  else {
    throw new Error("Unsupported file format");
  }

  text = normalizeText(text);

  return extractResumeData(text);
}

/* ================= PDF PARSER ================= */

async function parsePDFWithDocumentAI(fileBuffer) {
  const base64Content = fileBuffer.toString("base64");

  const request = {
    name: process.env.DOCUMENT_AI_PROCESSOR,
    rawDocument: {
      content: base64Content,
      mimeType: "application/pdf",
    },
  };

  const [result] = await docClient.processDocument(request);
  return result.document.text || "";
}

/* ================= TEXT PARSER (COMMON) ================= */

function extractResumeData(text) {
  const email = extractEmail(text);

  const fullName =
    extractNameFromTop(text) ||
    nameFromEmail(email);

  const { firstName, lastName } = splitName(fullName);

  const skillsText = extractSection(text, "SKILLS");
  const educationText = extractSection(text, "EDUCATION");
  const experienceText = extractExperience(text);

  return {
    first_name: firstName,
    last_name: lastName,
    email_id: email,
    phone_number: extractPhone(text),
    skills: skillsText,
    education: educationText,
    experience: experienceText,
    rawText: text,
  };
}

/* ================= HELPERS ================= */

function extractNameFromTop(text) {
  return text.split("\n").find(l =>
    /^[A-Z][A-Z\s]{4,}$/.test(l)
  ) || "";
}

function nameFromEmail(email) {
  return email
    ?.split("@")[0]
    ?.replace(/[._]/g, " ")
    ?.replace(/\b\w/g, c => c.toUpperCase()) || "";
}

function extractEmail(text) {
  return text.match(/[^\s]+@[^\s]+/)?.[0] || "";
}

function extractPhone(text) {
  const matches = text.match(
    /(\+?\d{1,3}[\s.-]?)?\d{10,14}/g
  );
  return matches?.[0] || "";
}

function extractSection(text, title) {
  const match = text.match(
    new RegExp(`${title}[\\s\\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|$)`, "i")
  );
  return match?.[0]?.replace(title, "").trim() || "";
}

function extractExperience(text) {
  return text.match(/(\d+)\+?\s+years?/i)?.[0] || "";
}

function splitName(name) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}
