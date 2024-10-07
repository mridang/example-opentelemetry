import { Global, Module } from '@nestjs/common';
import { secretName } from './constants';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestIdMiddleware } from './correlation.middleware';
import { ClsModule } from 'nestjs-cls';
import { TimingInterceptor } from './timing.interceptor';
import { ExceptionInterceptor } from './exception.interceptor';
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { BetterLogger } from './logger';
import { DefaultsModule } from '@mridang/nestjs-defaults';
import { AppController } from './app.controller';

@Global()
@Module({
  imports: [
    OpenTelemetryModule.forRoot(),
    DefaultsModule.register({
      configName: secretName,
    }),
  ],
  controllers: [AppController],
  providers: [
    //
  ],
  exports: [
    //
  ],
})
export class AppModule {
  //
}
