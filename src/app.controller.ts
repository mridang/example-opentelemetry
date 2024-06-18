import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ServerTiming } from './misc/timing.decorator';
import { getCurrentInvoke } from '@codegenie/serverless-express';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {
    //
  }

  @Get('logme')
  logMe() {
    this.logger.log('this is a test message');
    return 'ok';
  }

  @Get('debug')
  debug() {
    return {
      ...getCurrentInvoke(),
    };
  }

  @Get('goboom')
  goboom() {
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
