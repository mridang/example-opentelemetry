import { Global, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import path, { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import getSecret from './utils/secrets';
import { secretName } from './constants';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestIdMiddleware } from './correlation.middleware';
import { ClsModule } from 'nestjs-cls';
import { TimingInterceptor } from './timing.interceptor';
import { ExceptionInterceptor } from './exception.interceptor';
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { BetterLogger } from './logger';

@Global()
@Module({
  imports: [
    OpenTelemetryModule.forRoot(),
    ClsModule.forRoot({
      global: true,
    }),
    HttpModule,
    TerminusModule,
    SentryModule.forRootAsync({
      useFactory: async (secretsManagerClient: SecretsManagerClient) => {
        if (process.env.SENTRY_DSN) {
          return {
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'development',
            enabled: !['development', 'test'].includes(
              process.env.NODE_ENV || '',
            ),
            logLevels: ['debug'],
          };
        } else {
          const secretValue = await getSecret(secretName, secretsManagerClient);
          const sentryDSN = JSON.parse(secretValue) as { SENTRY_DSN: string };
          return {
            dsn: new URL(sentryDSN.SENTRY_DSN).toString(),
            environment: process.env.NODE_ENV || 'development',
            enabled: !['development', 'test'].includes(
              process.env.NODE_ENV || '',
            ),
            logLevels: ['debug'],
          };
        }
      },
      inject: ['SECRETS_MANAGER_CLIENT'],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    BetterLogger,
    {
      provide: 'ENV_PATH',
      useValue: process.env.ENV_PATH || path.resolve(process.cwd(), '.env'),
    },
    {
      provide: 'SECRETS_MANAGER_CLIENT',
      useFactory: () => {
        return new SecretsManagerClient();
      },
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor,
    },
  ],
  exports: ['ENV_PATH', 'SECRETS_MANAGER_CLIENT'],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
