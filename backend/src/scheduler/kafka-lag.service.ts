import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Admin } from 'kafkajs';

@Injectable()
export class KafkaLagService implements OnModuleInit, OnModuleDestroy {
  private admin: Admin;
  private readonly logger = new Logger(KafkaLagService.name);

  async onModuleInit() {
    // Instantiate a dedicated Kafka admin client to monitor topic offsets
    const kafka = new Kafka({
      clientId: 'admin-lag-monitor',
      brokers: ['localhost:9092'], // Should ideally come from ConfigService
    });
    
    this.admin = kafka.admin();
    try {
      await this.admin.connect();
      this.logger.log('Kafka Admin connected for lag monitoring');
    } catch (error) {
      this.logger.error('Failed to connect Kafka Admin', error);
    }
  }

  async onModuleDestroy() {
    if (this.admin) {
      await this.admin.disconnect();
    }
  }

  async getConsumerLag(topic: string, groupId: string): Promise<number> {
    try {
      const topicOffsets = await this.admin.fetchTopicOffsets(topic);
      const groupOffsets = await this.admin.fetchOffsets({ groupId, topics: [topic] });

      let totalLag = 0;

      for (const topicOffset of topicOffsets) {
        // Find corresponding group offset for this partition
        const groupTopic = groupOffsets.find(t => t.topic === topic);
        if (!groupTopic) continue;

        const groupPartition = groupTopic.partitions.find(p => p.partition === topicOffset.partition);
        
        const highWatermark = parseInt(topicOffset.high, 10);
        
        // If the consumer hasn't committed anything yet, the offset might be '-1'
        const consumerOffset = groupPartition && groupPartition.offset !== '-1' 
            ? parseInt(groupPartition.offset, 10) 
            : 0;
        
        totalLag += Math.max(0, highWatermark - consumerOffset);
      }

      return totalLag;
    } catch (error) {
      this.logger.error(`Error fetching consumer lag for topic ${topic}`, error);
      return 0; // Return 0 to prevent blocking the scheduler in case of errors
    }
  }
}
