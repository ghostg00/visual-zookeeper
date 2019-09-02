import { BaseDoc } from '@/utils/db';

export interface ZKServer extends BaseDoc {
  host: string;
  port: number;
}
