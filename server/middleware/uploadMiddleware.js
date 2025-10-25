const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_DIR || "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter for receipts (images/pdf)
const receiptFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("File type not supported. Only images and PDFs are allowed."));
};

// File filter for schedule uploads (excel/csv)
const scheduleFileFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls|csv/;
  const mimetype =
    filetypes.test(file.mimetype) ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype === "text/csv";
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(
    new Error(
      "File type not supported. Only .xlsx, .xls, and .csv are allowed."
    )
  );
};

const uploadReceipt = multer({
  storage: storage,
  fileFilter: receiptFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit from spec
});

const uploadSchedule = multer({
  storage: storage,
  fileFilter: scheduleFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit from spec
});

module.exports = { uploadReceipt, uploadSchedule };
