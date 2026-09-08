export class AuditLogDto {
  action: string;
  entityName: string;
  details: Record<string, any>;
  createdAt: Date;
}
