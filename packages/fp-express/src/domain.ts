import type { RequestHandler } from "express";

export enum ErrorType {
  NotFound = "NotFound",
  BadRequest = "BadRequest",
  General = "General",
  Skip = "Skip",
}

export type AppError = {
  type: ErrorType;
  error: string;
};

const stringifyUnknownError = (reason: unknown) =>
  (reason as Error).message ?? JSON.stringify(reason) ?? "Unknown error";

export const generalError = <E = unknown>(reason: E) => ({
  type: ErrorType.General,
  error: stringifyUnknownError(reason),
});

export const badRequest = <E = unknown>(reason: E) => ({
  type: ErrorType.BadRequest,
  error: stringifyUnknownError(reason),
});

export type HandlerContext<Ctx> = {
  params: Parameters<RequestHandler>;
  context: Ctx;
};
