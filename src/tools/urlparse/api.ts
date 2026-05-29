import { runAction } from "../../lib/ipc";

export interface QueryParam {
  key: string;
  value: string;
}

export interface ParsedUrl {
  scheme: string;
  username: string;
  password: string;
  host: string;
  port: string;
  path: string;
  query: string;
  fragment: string;
  query_params: QueryParam[];
}

export function urlParse(input: string): Promise<ParsedUrl> {
  return runAction<ParsedUrl>("url.parse", { input });
}
