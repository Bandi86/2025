import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitterService } from './event-emitter.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Global event emitter configuration
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [EventEmitterService],
  exports: [EventEmitterService],
})
export class EventsModule {} 