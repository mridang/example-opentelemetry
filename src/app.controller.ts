import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ServerTiming } from './misc/timing.decorator';
import { getCurrentInvoke } from '@codegenie/serverless-express';

@Controller()
export class AppController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {
    //
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
