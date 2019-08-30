import { BaseDoc } from '@/utils/db';

export interface Equipment extends BaseDoc {
  host: string;
  name: string;
  systemVersion: string;
  remark: string;
  status?: string;
}
