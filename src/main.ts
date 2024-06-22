import * as packageJson from '../package.json';
//import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import {
//   ConsoleMetricExporter,
//   PeriodicExportingMetricReader,
// } from '@opentelemetry/sdk-metrics';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  ConsoleLogRecordExporter,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { Tracing } from '@amplication/opentelemetry-nestjs';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

Tracing.init({
  serviceName: packageJson.name,
  idGenerator: new AWSXRayIdGenerator(),
  textMapPropagator: new AWSXRayPropagator(),
  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new ConsoleMetricExporter(),
  // }),
  logRecordProcessor: new SimpleLogRecordProcessor(
    new ConsoleLogRecordExporter(),
  ),
  instrumentations: [getNodeAutoInstrumentations()],
  //spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()), //new SimpleSpanProcessor(new OTLPTraceExporter({ url: 'http://localhost:4317' }))
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({ url: 'http://localhost:4317' }),
  ),
});

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import configure from './app';
import { BetterLogger } from './logger';
import { ClsService } from 'nestjs-cls';
import { AsyncLocalStorage } from 'node:async_hooks';

async function bootstrap() {
  const nestApp = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: new BetterLogger(new ClsService(new AsyncLocalStorage())),
  });

  configure(nestApp);
  await nestApp.init();
  await nestApp.listen(3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap().then(() => {
  console.log('\x07');
});
