import { Tracing } from '@amplication/opentelemetry-nestjs';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { XraySpanExporter } from '@mridang/exporter-xray';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { AWSXRayLambdaPropagator } from '@opentelemetry/propagator-aws-xray-lambda';

const oltpConfig = {
  url: ((url) => url?.split('?')[0])(process.env.OLTP_ENDPOINT),
  headers: ((url) => {
    const query = new URL(url ?? '').search;
    const token = new URLSearchParams(query).get('access_token');
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  })(process.env.OLTP_ENDPOINT ?? ''),
};

Tracing.init({
  serviceName: process.env.SERVICE_NAME || 'unknown',
  idGenerator: new AWSXRayIdGenerator(),
  textMapPropagator: new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
      new AWSXRayLambdaPropagator(),
    ],
  }),
  logRecordProcessors: process.env.OLTP_ENDPOINT
    ? [new BatchLogRecordProcessor(new OTLPLogExporter(oltpConfig))]
    : [],
  spanProcessors: [
    process.env.OLTP_ENDPOINT
      ? new SimpleSpanProcessor(new OTLPTraceExporter(oltpConfig))
      : new SimpleSpanProcessor(new XraySpanExporter()),
  ],
});
