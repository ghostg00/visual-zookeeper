import { BaseDoc } from "@/utils/db";

export interface ZKServer extends BaseDoc {
  host: string;
  port: number;
}

export interface AddNodeModal {
  visible: boolean;
  parentNode: string;
  nodeName: string;
  path: string;
  nodeData: string | null;
}
