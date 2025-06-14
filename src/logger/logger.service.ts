// src/logger/logger.service.ts
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.printf(
      ({ level, message, timestamp }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`,
    );

    this.logger = winston.createLogger({
      level: 'info', // default level
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
      transports: [
        new winston.transports.Console(),

        // Rotating log file for all logs
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d', // keep logs for 14 days
          level: 'info',
        }),

        // Separate log file for errors
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d', // keep error logs for 30 days
          level: 'error',
        }),
      ],
    });
  }

  info(message: string) {
    this.logger.info(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  error(message: string) {
    this.logger.error(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
