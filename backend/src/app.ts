// life-admin-assistant/backend/src/app.ts
import express from "express";
import cors from "cors";
import authRoute from "./routes/auth";
import profileRoute from "./routes/profile";
import taskRoute from "./routes/task";
import reminderRoute from "./routes/reminder";
import templateRoute from "./routes/template";
import checklistRoute from "./routes/checklist"; // TAMBAH INI

const app = express();

// Konfigurasi CORS yang lebih lengkap
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware untuk debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/profile", profileRoute);
app.use("/api/v1/tasks", taskRoute);
app.use("/api/v1/reminders", reminderRoute);
app.use("/api/v1/templates", templateRoute);
app.use("/api/v1/checklist", checklistRoute); // TAMBAH INI

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Endpoint not found",
    path: req.path,
    method: req.method 
  });
});

// Error handling middleware yang lebih baik
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error stack:', err.stack);
  console.error('Error details:', {
    message: err.message,
    name: err.name,
    code: err.code
  });
  
  // Default error
  const statusCode = err.status || 500;
  const message = err.message || "Something went wrong!";
  
  res.status(statusCode).json({ 
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});