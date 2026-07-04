import type { ErrorCode } from './error-codes.js';
import { HTTP_STATUS_BY_ERROR } from './error-codes.js';

export interface AppErrorDetails {
  field?: string;
  message: string;
}

/** Contract §4 — 統一アプリケーションエラー */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details: AppErrorDetails[];

  constructor(code: ErrorCode, message: string, details: AppErrorDetails[] = []) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = HTTP_STATUS_BY_ERROR[code];
    this.details = details;
  }
}
