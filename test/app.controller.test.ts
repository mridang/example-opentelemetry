import { End2EndModule } from './e2e.module';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from '@mridang/nestjs-defaults';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ClsService } from 'nestjs-cls';

class TestDTO {
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsNotEmpty()
  message?: string;
}

@Controller()
class DynamicController {
  constructor(private readonly clsService: ClsService) {
    //
  }

  @Get('500')
  get500() {
    throw new Error('500 error');
  }

  @Get('error')
  getError() {
    throw new InternalServerErrorException('General error');
  }

  @Get('set-cookie')
  setCookie(@Res({ passthrough: true }) res: Response) {
    res.cookie('test', 'NestJS');
    return 'Okie';
  }

  @Get('read-cookie')
  readCookie(@Req() req: Request) {
    return req.cookies['test'] || 'No cookie found';
  }

  @Get('cors-test')
  getCorsTest() {
    return { message: 'CORS is enabled' };
  }

  @Post('validate')
  validateTest(@Body() testDto: TestDTO) {
    return testDto;
  }

  @Get('cls-ctx')
  getClsCtx() {
    return this.clsService.get('ctx') || {};
  }
}

const testModule = new End2EndModule({
  imports: [
    {
      module: AppModule,
      controllers: [DynamicController],
      providers: [],
    },
  ],
});

describe('app.controller test', () => {
  beforeAll(async () => {
    await testModule.beforeAll();
  });

  afterAll(async () => {
    await testModule.afterAll();
  });

  it('/goboom (GET)', () => {
    return request(testModule.app.getHttpServer())
      .get('/goboom')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
