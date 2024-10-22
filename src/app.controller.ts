import { Controller, Get, Logger } from '@nestjs/common';
import { getCurrentInvoke } from '@codegenie/serverless-express';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get('logme')
  logMe() {
    this.logger.log('this is a test message');
    this.logger.log('this is a test message', 'foo');
    this.logger.log('this is a test message', 'foo', { baz: 'bar' });
    return 'ok';
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
