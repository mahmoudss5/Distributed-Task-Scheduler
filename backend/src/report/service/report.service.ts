import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportService {
  constructor(
    private readonly auditLogService: AuditLogService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async generateReport(userId: string): Promise<string> {
    const allLogs = await this.auditLogService.findByUser(userId);

    // Filter logs for the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentLogs = allLogs.filter(
      (log) => new Date(log.createdAt) >= oneWeekAgo,
    );

    // Generate HTML with Tailwind styling
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Activity Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-800 font-sans p-8">
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="bg-blue-600 text-white px-6 py-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold">Weekly Activity Report</h1>
            <p class="text-sm mt-1 opacity-80">Report generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="p-6">
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-lg font-semibold text-gray-700">User ID:</h2>
                    <p class="text-gray-600 font-mono text-sm">${userId}</p>
                </div>
                <div class="text-right">
                    <h2 class="text-lg font-semibold text-gray-700">Total Activities:</h2>
                    <p class="text-3xl font-bold text-blue-600">${recentLogs.length}</p>
                </div>
            </div>

            <h3 class="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Activity Details</h3>
            
            ${
              recentLogs.length > 0
                ? `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${recentLogs
                          .map(
                            (log) => `
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    ${log.action}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                ${log.entityName}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title='${log.details ? JSON.stringify(log.details).replace(/'/g, '&#39;') : '-'}'>
                                ${log.details ? JSON.stringify(log.details) : '-'}
                            </td>
                        </tr>
                        `,
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>
            `
                : `
            <div class="text-center py-10 bg-gray-50 rounded-lg">
                <p class="text-gray-500">No activity recorded in the last 7 days.</p>
            </div>
            `
            }
        </div>
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
            Confidential - For internal use only
        </div>
    </div>
</body>
</html>
    `;

    return html;
  }

  async generatePdfReport(userId: string): Promise<Report> {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const html = await this.generateReport(userId);
    await page.setContent(html, { waitUntil: 'load' });

    // save locally on the backend
    const fileName = `report-${userId}-${Date.now()}.pdf`;
    const reportsDir = path.join(process.cwd(), 'reports');
    const filePath = path.join(reportsDir, fileName);
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    await page.pdf({
      path: filePath,
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    
    const newReport = this.reportRepository.create({
      userId,
      fileName,
      filePath,
    });
    
    return await this.reportRepository.save(newReport);
  }

  async findById(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }
    return report;
  }
}
