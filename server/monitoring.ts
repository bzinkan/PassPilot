import type { Request } from "express";

/**
 * Production error monitoring utilities
 * 
 * In production, you can enable these integrations to catch null reference errors
 * and other unexpected issues early with proper stack traces and context.
 */

interface ErrorContext {
  error: Error;
  request: {
    method: string;
    path: string;
    query: any;
    body: any;
    userId?: string;
  };
  timestamp: string;
  environment: string;
}

/**
 * Send error to Sentry for production monitoring
 * Uncomment and configure when you have Sentry set up
 */
export async function sendToSentry(error: Error, req: Request): Promise<void> {
  // Example Sentry integration:
  // const Sentry = require('@sentry/node');
  // Sentry.captureException(error, {
  //   tags: {
  //     endpoint: req.path,
  //     method: req.method,
  //   },
  //   user: {
  //     id: req.user?.id,
  //   },
  //   extra: {
  //     query: req.query,
  //     body: req.body,
  //   },
  // });
  
  console.log("Sentry integration not configured");
}

/**
 * Send error notification to Discord webhook for immediate alerts
 * Useful for catching critical null reference errors in production
 */
export async function sendToDiscordWebhook(error: Error, req: Request): Promise<void> {
  const webhookUrl = process.env.DISCORD_ERROR_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const context: ErrorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack || "No stack trace",
    } as Error,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      userId: (req as any).user?.id,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  };

  const embed = {
    title: "🚨 Production Error",
    description: `**${error.name}**: ${error.message}`,
    color: 0xff0000, // Red
    fields: [
      {
        name: "Endpoint",
        value: `${req.method} ${req.path}`,
        inline: true,
      },
      {
        name: "Environment", 
        value: context.environment,
        inline: true,
      },
      {
        name: "Timestamp",
        value: context.timestamp,
        inline: true,
      },
      {
        name: "Stack Trace",
        value: `\`\`\`${error.stack?.substring(0, 1000) || "No stack trace"}\`\`\``,
        inline: false,
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
  } catch (webhookError) {
    console.error("Failed to send Discord webhook:", webhookError);
  }
}

/**
 * Send error notification to Slack webhook
 * Alternative to Discord for team notifications
 */
export async function sendToSlackWebhook(error: Error, req: Request): Promise<void> {
  const webhookUrl = process.env.SLACK_ERROR_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const context: ErrorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack || "No stack trace",
    } as Error,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      userId: (req as any).user?.id,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  };

  const payload = {
    text: "🚨 Production Error Alert",
    attachments: [
      {
        color: "danger",
        fields: [
          {
            title: "Error",
            value: `${error.name}: ${error.message}`,
            short: false,
          },
          {
            title: "Endpoint",
            value: `${req.method} ${req.path}`,
            short: true,
          },
          {
            title: "Environment",
            value: context.environment,
            short: true,
          },
          {
            title: "Stack Trace",
            value: `\`\`\`${error.stack?.substring(0, 500) || "No stack trace"}\`\`\``,
            short: false,
          },
        ],
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (webhookError) {
    console.error("Failed to send Slack webhook:", webhookError);
  }
}

/**
 * Simple console logging with enhanced formatting for development
 */
export function logError(error: Error, req: Request): void {
  const context: ErrorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack || "No stack trace",
    } as Error,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      userId: (req as any).user?.id,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  };

  console.error("=== ENHANCED ERROR LOG ===");
  console.error("Timestamp:", context.timestamp);
  console.error("Environment:", context.environment);
  console.error("Request:", `${context.request.method} ${context.request.path}`);
  console.error("User ID:", context.request.userId || "Anonymous");
  console.error("Error:", context.error.name, "-", context.error.message);
  console.error("Stack:", context.error.stack);
  console.error("Query:", JSON.stringify(context.request.query, null, 2));
  console.error("Body:", JSON.stringify(context.request.body, null, 2));
  console.error("=== END ERROR LOG ===\n");
}