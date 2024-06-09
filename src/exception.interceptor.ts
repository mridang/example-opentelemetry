import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { SentryInterceptor } from '@ntegral/nestjs-sentry';
import { Scope } from '@sentry/hub';
import { getCurrentInvoke } from '@codegenie/serverless-express';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

@Injectable()
export class ExceptionInterceptor extends SentryInterceptor {
  constructor() {
    super({
      filters: [
        {
          type: HttpException,
          filter: (exception: HttpException) =>
            HttpStatus.INTERNAL_SERVER_ERROR > exception.getStatus(),
        },
      ],
    });
  }

  protected captureException(
    context: ExecutionContext,
    scope: Scope,
    exception: HttpException,
  ) {
    const event = getCurrentInvoke().event as APIGatewayProxyEventV2;
    if (event?.requestContext?.requestId !== undefined) {
      scope.setExtra('request-id', event.requestContext.requestId);
    }

    if (event?.requestContext?.accountId !== undefined) {
      scope.setExtra('account-id', event.requestContext.accountId);
    }

    if (event?.requestContext?.domainName !== undefined) {
      scope.setExtra('domain-name', event?.requestContext?.domainName);
    }

    if (process.env.AWS_REGION !== undefined) {
      scope.setExtra('aws-region', process.env.AWS_REGION);
    }

    return super.captureException(context, scope, exception);
  }
}
