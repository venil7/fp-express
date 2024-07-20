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

const stringifyUnknownError = (reason: unknown) => {
  if (reason) {
    if ((reason as Error).message) {
      return (reason as Error).message;
    }
    return JSON.stringify(reason);
  }
  return "Unknown error";
};

export const notFound = <E = unknown>(reason: E) => ({
  type: ErrorType.NotFound,
  error: "Not Found",
});

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
