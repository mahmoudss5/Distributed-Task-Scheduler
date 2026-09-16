import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../redis/redis.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogAction } from '../audit-log/enums/audit-log-action.enum';

@Injectable()
export class LeaderElectionService {
    private readonly logger = new Logger(LeaderElectionService.name);
    private isLeader = false;
    private readonly instanceId: string = uuidv4();
    private readonly LEADER_KEY = 'scheduler:leader';
    private readonly TTL = 10;

    constructor(
        private readonly redisService: RedisService,
        private readonly auditLogService: AuditLogService,
    ) {}

    @Interval(5000)
    async electLeader(): Promise<void> {
        const won = await this.redisService.setNX(
            this.LEADER_KEY,
            this.instanceId,
            this.TTL,
        );

        if (won) {
            if (!this.isLeader) {
                this.logger.log(`Instance ${this.instanceId} is now the Leader`);
                await this.auditLogService.createLog(
                    AuditLogAction.LEADER_ELECTED,
                    'Scheduler',
                    this.instanceId,
                    undefined,
                    { message: 'Instance won leader election' }
                );
            }
            this.isLeader = true;
            return;
        }


        if (await this.redisService.renewLease(this.LEADER_KEY, this.instanceId, this.TTL)) {
            this.isLeader = true;
        } else {
            this.isLeader = false;
        }
    }

    amILeader(): boolean {
        return this.isLeader;
    }

    async ensureLeadership(): Promise<boolean> {
        if (!this.isLeader) return false;
        const stillLeader = await this.redisService.renewLease(
            this.LEADER_KEY,
            this.instanceId,
            this.TTL,
        );
        this.isLeader = stillLeader;
        return stillLeader;
    }

}
