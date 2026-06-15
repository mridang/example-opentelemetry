import { Global, Module } from '@nestjs/common';
import { secretName } from './constants.js';
import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import nestjsDefaults from '@mridang/nestjs-defaults';
const { DefaultsModule } = nestjsDefaults;
import { AppController } from './app.controller.js';

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
