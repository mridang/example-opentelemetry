import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { ServerTiming } from './misc/timing.decorator';
import { getCurrentInvoke } from '@codegenie/serverless-express';
import axios from 'axios';

@Controller()
export class AppController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {
    //
  }

  @Get('debug')
  async debug() {
    const xxx = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const xr = await xxx.json();
    console.log(xr);

    const response = await axios.get(
      'https://jsonplaceholder.typicode.com/posts/1',
    );
    console.log(response.data);
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
