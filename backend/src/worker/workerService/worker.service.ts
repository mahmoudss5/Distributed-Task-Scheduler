import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class WorkerService {

  constructor(@Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka) {
   kafkaClient.subscribeToResponseOf('job-ready');
   kafkaClient.connect();
  }


 @Interval(20000)
  async heartbeat(): Promise<void> {
    // here go the logic to send heartbeat to the kafka server
  }

  @MessagePattern('job-ready')
  async handleJobReadyMessage(message: any): Promise<void> {
    const { jobId, jobData } = message.value;
    console.log(`Received job-ready message for jobId: ${jobId}`);
    // Here you can implement the logic to process the job
  }


}
