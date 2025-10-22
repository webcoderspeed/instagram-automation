/**
 * Database Connection
 * Handles MongoDB connection using Mongoose
 */

import mongoose from 'mongoose';
import env from './env.config';
import logger from '../utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to MongoDB database
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const connectionString = env.DATABASE_URL!; 
      
      await mongoose.connect(connectionString, {
        // Connection options
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferCommands: false // Disable mongoose buffering
      });

      this.isConnected = true;
      
      logger.info('✅ Database connected successfully', {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      });

      // Handle connection events
      this.setupEventHandlers();

    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw error;
    }
  }

  /**
   * Setup mongoose connection event handlers
   */
  private setupEventHandlers(): void {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get database connection info
   */
  public getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();
export default databaseConnection;