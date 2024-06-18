import * as packageJson from '../package.json';
import { Tracing } from '@amplication/opentelemetry-nestjs';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs/build/src/export/SimpleLogRecordProcessor';
import { MultiLogRecordProcessor } from '@opentelemetry/sdk-logs/build/src/MultiLogRecordProcessor';
import { ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs/build/src/export/ConsoleLogRecordExporter';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

Tracing.init({
  serviceName: packageJson.name,
  idGenerator: new AWSXRayIdGenerator(),
  textMapPropagator: new AWSXRayPropagator(),
  logRecordProcessor: new MultiLogRecordProcessor(
    [
      new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
      new SimpleLogRecordProcessor(
        new OTLPLogExporter({
          url: 'http://localhost:4317',
        }),
      ),
    ],
    0,
  ),
  //spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: 'http://localhost:4317',
    }),
  ),
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import configure from './app';

async function bootstrap() {
  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  configure(nestApp);
  await nestApp.init();
  await nestApp.listen(3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap().then(() => {
  console.log('\x07');
});
