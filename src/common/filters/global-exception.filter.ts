import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Standardized error response interface
export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error: string;
  requestId?: string;
}

// Global filter sanitizing all unexpected exceptions and formatting uniform error responses
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorName = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const parsed = res as Record<string, unknown>;
        message = (parsed['message'] as string | string[]) || exception.message;
        errorName = (parsed['error'] as string) || exception.name;
      }
    } else if (exception instanceof Error) {
      // Log internal error safely without exposing internal details to client
      this.logger.error(
        `Unhandled Exception at ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      message = 'An unexpected error occurred. Please try again later.';
      errorName = 'InternalError';
    }

    const errorPayload: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: errorName,
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    response.status(status).json(errorPayload);
  }
}
