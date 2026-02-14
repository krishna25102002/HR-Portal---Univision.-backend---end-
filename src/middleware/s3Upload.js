import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only PDF/DOC/DOCX allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(), // 🔥 IMPORTANT
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export default upload;
