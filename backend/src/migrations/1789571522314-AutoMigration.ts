import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1789571522314 implements MigrationInterface {
    name = 'AutoMigration1789571522314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` varchar(36) NOT NULL, \`action\` enum ('SCHEDULER_PAUSED', 'WORKER_DEAD_DETECTED', 'LEADER_ELECTED', 'JOB_CREATED', 'JOB_UPDATED', 'JOB_DELETED', 'SYSTEM_SHUTDOWN', 'EMAIL_CONNECTION_FAILED') NOT NULL, \`entityName\` varchar(255) NOT NULL, \`entityId\` varchar(255) NOT NULL, \`userId\` varchar(255) NULL, \`details\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`job_failure\` (\`id\` varchar(36) NOT NULL, \`jobId\` varchar(255) NOT NULL, \`attemptNumber\` int NOT NULL, \`retryCountBeforeFailure\` int NOT NULL, \`permanent\` tinyint NOT NULL DEFAULT 0, \`jobType\` varchar(255) NOT NULL, \`userId\` varchar(255) NOT NULL, \`workerId\` varchar(255) NULL, \`jobPayload\` json NOT NULL, \`errorMessage\` text NOT NULL, \`errorName\` varchar(255) NULL, \`errorStack\` text NULL, \`dlqTopic\` varchar(255) NULL, \`dlqPublished\` tinyint NOT NULL DEFAULT 0, \`dlqPublishedAt\` datetime NULL, \`failedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_6ddb8254518c6307308376d441\` (\`jobId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`job\` (\`id\` varchar(36) NOT NULL, \`jobPayload\` json NOT NULL, \`type\` enum ('sendEmail', 'generateReport') NOT NULL, \`priority\` int NOT NULL, \`priorityLevel\` enum ('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'LOW', \`workerId\` varchar(255) NULL, \`status\` enum ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD', 'CANCELED') NOT NULL DEFAULT 'PENDING', \`executeAt\` datetime NULL, \`userId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`cron\` varchar(255) NULL, \`runAt\` datetime NULL, \`retryCount\` int NOT NULL DEFAULT '3', \`attemptCount\` int NOT NULL DEFAULT '0', \`isCanceled\` tinyint NOT NULL DEFAULT '0', \`canceledAt\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`reports\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`fileName\` varchar(255) NOT NULL, \`filePath\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('user', 'admin') NOT NULL DEFAULT 'user', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`worker\` (\`id\` varchar(36) NOT NULL, \`host\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL DEFAULT 'active', \`lastHeartbeat\` datetime NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`worker\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`reports\``);
        await queryRunner.query(`DROP TABLE \`job\``);
        await queryRunner.query(`DROP INDEX \`IDX_6ddb8254518c6307308376d441\` ON \`job_failure\``);
        await queryRunner.query(`DROP TABLE \`job_failure\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
    }

}
