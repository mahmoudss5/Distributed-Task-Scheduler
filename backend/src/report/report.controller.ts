import { Controller, Post, Get, Param, Res, NotFoundException, UseGuards } from '@nestjs/common';
import { ReportService } from './service/report.service';
import type { Response } from 'express';
import * as fs from 'fs';
import { JobsServiceService } from '../jobs/jobs-service/jobs-service.service';
import { JobType } from '../jobs/entites/job.type.enum';
import { JobPriorityLevel } from '../jobs/entites/job-priority-level.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly jobsService: JobsServiceService
  ) {}

  @Post('generate')
  async generateReport(@CurrentUser() user: any) {
    const job = await this.jobsService.createJob({
      type: JobType.generateReport,
      jobPayload: { userId: user.id },
      priorityLevel: JobPriorityLevel.MEDIUM,
      executeAt: new Date(),
    }, user.id);

    return {
      message: 'Report generation job submitted successfully',
      jobId: job.id,
    };
  }

  @Get('download/:id')
  async downloadReport(@Param('id') id: string, @CurrentUser() user: any, @Res() res: Response) {
    const report = await this.reportService.findById(id);

    // Ensure the report belongs to the requesting user
    if (report.userId !== user.id) {
      throw new NotFoundException('Report not found');
    }

    if (fs.existsSync(report.filePath)) {
      res.download(report.filePath, report.fileName);
    } else {
      throw new NotFoundException('Report file not found on disk');
    }
  }
}
