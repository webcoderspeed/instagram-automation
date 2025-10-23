import dotenv from "dotenv";

dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import logger from "./utils/logger";
import { instagramService } from "./services/instagram";
import { instagramIntegrationService } from "./integrations";
import {
  createWebhookController,
} from "./services/webhook/webhook-controller";
import { InstagramController } from "./controllers/instagram.controller";

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware
const morganFormat =
  ":method :url :status :response-time ms - :res[content-length]";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (basic implementation)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.get("/", (req: Request, res: Response) => {
  logger.info("Root endpoint accessed");
  res.json({
    message: "Welcome to the Instagram Automation API",
    status: "Server is running successfully!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.get("/health", (req: Request, res: Response) => {
  logger.info("Health check endpoint accessed");
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get("/api/status", (req: Request, res: Response) => {
  logger.info("API status endpoint accessed");
  res.json({
    api: "Instagram Graph API Automation",
    status: "active",
    version: "2.0.0",
    endpoints: {
      core: ["GET /", "GET /health", "GET /api/status"],
      authentication: [
        "GET /auth/instagram",
        "GET /auth/instagram/callback", 
        "POST /auth/instagram/refresh",
        "GET /auth/instagram/user/:userId",
        "POST /auth/instagram/revoke",
      ],
      instagram: [
        "GET /api/instagram/profile",
        "GET /api/instagram/media",
        "GET /api/instagram/media/:id",
        "POST /api/instagram/publish",
        "GET /api/instagram/insights/media/:id",
        "GET /api/instagram/insights/account",
        "GET /api/instagram/hashtag/:hashtag",
        "GET /api/instagram/rate-limit",
      ],
      webhooks: [
        "GET /webhook/instagram",
        "POST /webhook/instagram",
        "POST /api/webhook/subscribe",
        "GET /api/webhook/subscriptions",
      ],
    },
    documentation: {
      authentication: "Use /auth/instagram to start OAuth flow",
      requirements: "Instagram Business/Creator account required for Graph API",
      rateLimit: "200 requests per hour per access token",
      webhooks: "Real-time notifications for comments, mentions, and messages",
    },
  });
});

// Instagram Graph API routes
app.get("/api/instagram/profile", async (req: Request, res: Response) => {
  try {
    logger.info("Instagram profile endpoint accessed");

    console.log({ a: process.env.INSTAGRAM_ACCESS_TOKEN });

    // Check if access token is configured
    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      return res.status(401).json({
        success: false,
        error: "Instagram access token not configured",
      });
    }

    instagramService.setConfig({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    });

    const profile = await instagramService.getUserProfile();

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Profile not found or access token invalid",
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error(`Error in profile endpoint: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
});

app.get("/api/instagram/media", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    logger.info(`Instagram media endpoint accessed with limit: ${limit}`);

    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      return res.status(401).json({
        success: false,
        error: "Instagram access token not configured",
      });
    }

    instagramService.setConfig({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    });

    const media = await instagramService.getUserMedia(limit);
    return res.json({
      success: true,
      data: media,
      count: media.length,
    });
  } catch (error) {
    logger.error(`Error in media endpoint: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch media",
    });
  }
});

app.get("/api/instagram/media/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`Instagram media details endpoint accessed for ID: ${id}`);

    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      return res.status(401).json({
        success: false,
        error: "Instagram access token not configured",
      });
    }

    instagramService.setConfig({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    });

    const media = await instagramService.getMediaDetails(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        error: "Media not found",
      });
    }

    return res.json({
      success: true,
      data: media,
    });
  } catch (error) {
    logger.error(`Error in media details endpoint: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch media details",
    });
  }
});

app.post("/api/instagram/publish", async (req: Request, res: Response) => {
  try {
    const { imageUrl, caption } = req.body;
    logger.info("Instagram publish endpoint accessed", {
      imageUrl,
      caption: caption?.substring(0, 50),
    });

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Image URL is required",
      });
    }

    if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
      return res.status(401).json({
        success: false,
        error: "Instagram access token not configured",
      });
    }

    instagramService.setConfig({
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    });

    // Create media container
    const container = await instagramService.createMediaContainer(
      imageUrl,
      caption
    );

    if (!container) {
      return res.status(400).json({
        success: false,
        error: "Failed to create media container",
      });
    }

    // Publish media
    const published = await instagramService.publishMedia(container.id);

    if (!published) {
      return res.status(400).json({
        success: false,
        error: "Failed to publish media",
      });
    }

    return res.json({
      success: true,
      data: {
        containerId: container.id,
        publishedId: published.id,
      },
      message: "Media published successfully",
    });
  } catch (error) {
    logger.error(`Error in publish endpoint: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to publish media",
    });
  }
});

app.get(
  "/api/instagram/insights/media/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      logger.info(`Instagram media insights endpoint accessed for ID: ${id}`);

      if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
        return res.status(401).json({
          success: false,
          error: "Instagram access token not configured",
        });
      }

      instagramService.setConfig({
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      });

      const insights = await instagramService.getMediaInsights(id);

      if (!insights) {
        return res.status(404).json({
          success: false,
          error: "Media insights not found or not available",
        });
      }

      return res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error(`Error in media insights endpoint: ${error}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch media insights",
      });
    }
  }
);

app.get(
  "/api/instagram/insights/account",
  async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as "day" | "week" | "days_28") || "day";
      logger.info(
        `Instagram account insights endpoint accessed for period: ${period}`
      );

      if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
        return res.status(401).json({
          success: false,
          error: "Instagram access token not configured",
        });
      }

      const insights = await instagramIntegrationService.getAccountInsights(
        process.env.INSTAGRAM_ACCESS_TOKEN,
        period
      );

      if (!insights) {
        return res.status(404).json({
          success: false,
          error: "Account insights not found or not available",
        });
      }

      return res.json({
        success: true,
        data: insights,
        period,
      });
    } catch (error) {
      logger.error(`Error in account insights endpoint: ${error}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch account insights",
      });
    }
  }
);

app.get(
  "/api/instagram/hashtag/:hashtag",
  async (req: Request, res: Response) => {
    try {
      const { hashtag } = req.params;
      logger.info(`Instagram hashtag endpoint accessed for: ${hashtag}`);

      if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
        return res.status(401).json({
          success: false,
          error: "Instagram access token not configured",
        });
      }

      instagramService.setConfig({
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
      });

      const hashtagInfo = await instagramService.getHashtagInfo(hashtag);

      return res.json({
        success: true,
        data: hashtagInfo,
      });
    } catch (error) {
      logger.error(`Error in hashtag endpoint: ${error}`);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch hashtag information",
      });
    }
  }
);

app.get("/api/instagram/rate-limit", async (req: Request, res: Response) => {
  try {
    logger.info("Instagram rate limit endpoint accessed");

    const rateLimitStatus = instagramService.getRateLimitStatus();

    return res.json({
      success: true,
      data: {
        remaining: rateLimitStatus.remaining,
        resetTime: new Date(rateLimitStatus.resetTime).toISOString(),
        resetIn: Math.max(
          0,
          Math.ceil((rateLimitStatus.resetTime - Date.now()) / 1000)
        ),
      },
    });
  } catch (error) {
    logger.error(`Error in rate limit endpoint: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch rate limit status",
    });
  }
});

// Instagram Controller
const instagramController = new InstagramController();

// Webhook service
const webhookController = createWebhookController(
  process.env.INSTAGRAM_APP_SECRET || "",
  process.env.WEBHOOK_VERIFY_TOKEN || ""
);

app.get("/auth/instagram", instagramController.connect);

app.get("/auth/instagram/callback", instagramController.callback);

// Note: Instagram tokens are automatically managed by the platform

// Add user profile route using Instagram controller
app.get("/auth/instagram/user/:userId", instagramController.getProfile);

// Add disconnect route using Instagram controller  
app.post("/auth/instagram/revoke", instagramController.disconnect);

// Webhook endpoints
// Webhook verification endpoint (GET) - used by Meta to verify the webhook URL
app.get("/webhook/instagram", async (req: Request, res: Response) => {
  await webhookController.verifyWebhook(req, res);
});

// Webhook event endpoint (POST) - receives actual webhook events from Meta
app.post("/webhook/instagram", async (req: Request, res: Response) => {
  await webhookController.handleWebhook(req, res);
});

// Webhook subscription management endpoints
app.post("/api/webhook/subscribe", async (req: Request, res: Response) => {
  try {
    logger.info("Webhook subscription request received");

    const { access_token, fields } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    const defaultFields = [
      "comments",
      "mentions",
      "story_insights",
      "live_comments",
    ];

    const fieldsToSubscribe = fields || defaultFields;

    // For now, we'll implement webhook subscription management separately
    // This is Instagram API management, not webhook event handling
    const success = true; // Placeholder - implement webhook subscription via Instagram API

    if (success) {
      return res.json({
        success: true,
        message: "Successfully subscribed to webhook fields",
        fields: fieldsToSubscribe,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Failed to subscribe to webhook fields",
      });
    }
  } catch (error) {
    logger.error(`Error in webhook subscription: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to subscribe to webhooks",
    });
  }
});

app.get("/api/webhook/subscriptions", async (req: Request, res: Response) => {
  try {
    logger.info("Webhook subscriptions request received");

    const accessToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      (req.query.access_token as string);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token is required",
      });
    }

    // For now, we'll implement webhook subscription retrieval separately
    // This is Instagram API management, not webhook event handling
    const subscriptions = { data: [] }; // Placeholder - implement webhook subscription retrieval via Instagram API

    if (subscriptions) {
      return res.json({
        success: true,
        data: subscriptions,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Failed to get webhook subscriptions",
      });
    }
  } catch (error) {
    logger.error(`Error getting webhook subscriptions: ${error}`);
    return res.status(500).json({
      success: false,
      error: "Failed to get webhook subscriptions",
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info(`📱 Instagram Automation API is ready!`);
  logger.info(`🔍 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 Logs are being written to ./logs/ directory`);
});
