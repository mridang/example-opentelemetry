import { Controller, Get, Logger } from '@nestjs/common';
import { getCurrentInvoke } from '@codegenie/serverless-express';
import axios from 'axios';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

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

  @Get('crash')
  crash() {
    throw new Error('Oh no!');
  }

  @Get('captive')
  async doConnect() {
    const urls = [
      'https://networkcheck.kde.org/',
      'https://nmcheck.gnome.org/check_network_status.txt',
      'http://www.msftconnecttest.com/connecttest.txt',
      'http://www.msftncsi.com/ncsi.txt',
      'http://clients3.google.com/generate_204',
      'http://connectivitycheck.gstatic.com/generate_204',
      'https://www.apple.com/library/test/success.html',
      'https://captive.apple.com/hotspot-detect.html',
    ];

    const url = urls[Math.floor(Math.random() * urls.length)];

    try {
      const response = await fetch(url);
      // @ts-expect-error since the types are wrtong
      const headers = [...response.headers.entries()]
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      const body = await response.text();

      return `URL: ${url}\nHeaders:\n${headers}\nResponse:\n${body}`;
    } catch {
      throw new Error();
    }
  }
}
