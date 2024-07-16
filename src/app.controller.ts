import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ServerTiming } from './misc/timing.decorator';
import { getCurrentInvoke } from '@codegenie/serverless-express';
import axios from 'axios';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private readonly s3Client = new S3Client();

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {
    //
  }

  @Get('ctx')
  ctx() {
    return JSON.stringify(getCurrentInvoke());
  }

  @Get('logme')
  logMe() {
    this.logger.log('this is a test message');
  }

  @Get('goboom')
  goBoom() {
    try {
      throw new Error('boom');
    } catch (err) {
      this.logger.error('this is a test message', err);
      throw err;
    }
  }

  @Get('axios')
  async axios() {
    const response = await axios.get(
      'https://jsonplaceholder.typicode.com/posts/1',
    );
    return response.data;
  }

  @Get('fetch')
  async fetch() {
    const response = await fetch(
      'https://jsonplaceholder.typicode.com/todos/1',
    );
    return await response.json();
  }

  @Get('listbuckets')
  async listBuckets() {
    return await this.s3Client
      .send(new ListBucketsCommand({}))
      .then((result) => {
        result.Buckets?.map((bucket) => bucket.Name);
      });
  }

  @Get('crash')
  crash() {
    throw new Error('Oh no!');
  }

  @Get('health')
  @HealthCheck()
  @ServerTiming('controller', 'Controller method')
  check() {
    return this.health.check([
      () => this.http.pingCheck('1.1.1.1', 'https://1.1.1.1/'),
    ]);
  }
}
