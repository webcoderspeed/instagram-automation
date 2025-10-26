import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

import express from "express";
import { createServer } from "http";
import session from "express-session";
import {
  server as serverConfig,
  databaseConnection,
  sessionConfig,
  env,
} from "./config";
import { getCorsOptions } from "./middleware/cors.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { generalRateLimit } from "./middleware/rate-limit.middleware";
import routes from "./routes";
import logger from "./utils/logger";
import cors from 'cors'

/**
 * Social Media SaaS Automation Server
 *
 * Main server entry point that initializes the Express application
 * with all necessary middleware, routes, and error handling.
 */
class Server {
  private readonly app: express.Application;
  private server!: ReturnType<typeof createServer>;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await databaseConnection.connect();
    } catch (error) {
      logger.error("Failed to initialize database connection:", error);
      process.exit(1);
    }
  }

  /**
   * Initialize basic middleware (before database connection)
   */
  private initializeMiddleware(): void {
    // Request parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // CORS middleware
    this.app.use(cors(getCorsOptions(env.ALLOWED_ORIGINS)));

    // Session middleware (must be before routes)
    this.app.use(session(sessionConfig));

    // Rate limiting
    this.app.use("/api", generalRateLimit.middleware());

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });
      next();
    });
  }

  /**
   * Initialize all application routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? "1.0.0",
      });
    });

    // API routes
    this.app.use("/api", routes);

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        message: "Social Media SaaS Automation API",
        status: "Server is running successfully!",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? "1.0.0",
        documentation: "/api/docs",
      });
    });
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // 404 handler - using imported notFoundHandler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database connection first
      await this.initializeDatabase();

      const port = serverConfig.port;

      this.server = createServer(this.app);

      this.server.listen(port, () => {
        logger.info(`🚀 Server started successfully!`, {
          port,
          environment: serverConfig.environment,
          nodeVersion: process.version,
          timestamp: new Date().toISOString(),
        });
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      this.server.close(async () => {
        logger.info("HTTP server closed.");

        // Disconnect from database
        try {
          await databaseConnection.disconnect();
          logger.info("Database disconnected.");
        } catch (error) {
          logger.error("Error disconnecting from database:", error);
        }

        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 30000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  /**
   * Get Express application instance
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    logger.error("Failed to start server:", error);
    process.exit(1);
  });
}

export { Server };
export default Server;
