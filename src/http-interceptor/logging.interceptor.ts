import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new LoggerService();
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.logger.info(
      'Before...  url :: ' + context.getArgByIndex(0).originalUrl,
    );
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.info(`After... ${Date.now() - now}ms`);
      }),
    );
  }
}
