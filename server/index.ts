// Validate environment variables first - fail fast if anything is missing
import "./env";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureWebhookMiddleware } from "./webhooks";
import { sendToSentry, sendToDiscordWebhook, sendToSlackWebhook, logError } from "./monitoring";

const app = express();

// Global process-level error handlers for uncaught exceptions
// These catch null reference errors that escape Express error handling
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Process will exit...');
  
  // In production, send to monitoring before exit
  if (process.env.NODE_ENV === "production") {
    // Note: These are fire-and-forget since process is exiting
    sendToDiscordWebhook(error, { method: 'UNKNOWN', path: 'UNKNOWN' } as any).catch(console.error);
    sendToSlackWebhook(error, { method: 'UNKNOWN', path: 'UNKNOWN' } as any).catch(console.error);
  }
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  
  // In production, send to monitoring
  if (process.env.NODE_ENV === "production") {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    sendToDiscordWebhook(error, { method: 'UNKNOWN', path: 'UNKNOWN' } as any).catch(console.error);
    sendToSlackWebhook(error, { method: 'UNKNOWN', path: 'UNKNOWN' } as any).catch(console.error);
  }
});

// Configure webhook middleware BEFORE general JSON parsing
// Webhooks need raw body for signature validation
configureWebhookMiddleware(app);

// General middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - catches all unhandled errors including null reference errors
  app.use(async (err: any, req: Request, res: Response, _next: NextFunction) => {
    // Enhanced error logging with full context
    logError(err, req);
    
    // In production, send to monitoring services for immediate alerts
    if (process.env.NODE_ENV === "production") {
      try {
        await Promise.all([
          sendToSentry(err, req),
          sendToDiscordWebhook(err, req),
          sendToSlackWebhook(err, req),
        ]);
      } catch (monitoringError) {
        console.error("Failed to send error to monitoring services:", monitoringError);
      }
    }
    
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === "development" 
      ? err.message || "Internal Server Error"
      : "Internal Server Error"; // Hide error details in production
    
    // Return consistent API response format
    res.status(status).json({ 
      ok: false, 
      error: message 
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
