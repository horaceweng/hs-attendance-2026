import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BooleanTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Transform isActive from string to boolean if needed
    if (request.body) {
      // Handle isActive
      if (request.body.isActive !== undefined && typeof request.body.isActive === 'string') {
        request.body.isActive = request.body.isActive === 'true';
      }
      
      // Handle academicYearId
      if (request.body.academicYearId !== undefined && typeof request.body.academicYearId === 'string') {
        request.body.academicYearId = parseInt(request.body.academicYearId, 10);
      }
      
      // Handle year
      if (request.body.year !== undefined && typeof request.body.year === 'string') {
        request.body.year = parseInt(request.body.year, 10);
      }
    }
    
    return next.handle();
  }
}