import { Global, Module } from '@nestjs/common';
import { secretName } from './constants';
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { DefaultsModule } from '@mridang/nestjs-defaults';
import { AppController } from './app.controller';

@Global()
@Module({
  imports: [
    OpenTelemetryModule.forRoot(),
    DefaultsModule.register({
      configName: secretName,
    }),
  ],
  controllers: [AppController],
  providers: [
    //
  ],
  exports: [
    //
  ],
})
export class AppModule {
  //
}
