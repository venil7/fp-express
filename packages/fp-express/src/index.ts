import type { RequestHandler } from "express";
import * as RT from "fp-ts/ReaderTask";
import * as RTE from "fp-ts/ReaderTaskEither";
import * as I from "fp-ts/lib/Identity";
import * as T from "fp-ts/lib/Task";
import { pipe } from "fp-ts/lib/function";

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

export type HandlerContext<Ctx> = {
  handlerParams: Parameters<RequestHandler>;
  context: Ctx;
};

export type HandlerTask<T, Ctx = unknown> = RTE.ReaderTaskEither<
  HandlerContext<Ctx>,
  AppError,
  T
>;

export type ErrorHandler<Ctx> = (
  err: AppError
) => RT.ReaderTask<HandlerContext<Ctx>, unknown>;

export const errorHandler: ErrorHandler<unknown> =
  (err) =>
  ({ handlerParams: [_, res, next] }) =>
    T.fromIO(() => {
      console.error([err.type, err.error]);
      switch (err.type) {
        case ErrorType.BadRequest:
          return res.status(400).send(err.error);
        case ErrorType.NotFound:
          return res.status(404).send(err.error);
        case ErrorType.Skip:
          return next();
        case ErrorType.General:
        default:
          return res.status(500).send(err.error);
      }
    });

export type SuccessHandler<Ctx> = <T>(
  data: T
) => RT.ReaderTask<HandlerContext<Ctx>, unknown>;

export const successHandler: SuccessHandler<unknown> =
  <T>(data: T) =>
  ({ handlerParams: [_, res] }) =>
    T.fromIO(() => {
      console.info(["ok"]);
      res.status(200).send(data);
    });

export const createRequestHandler =
  <T, Ctx>(context: Ctx) =>
  (task: HandlerTask<T, Ctx>): RequestHandler =>
  (req, res, next) =>
    pipe(
      task,
      RTE.filterOrElse<AppError, T>(
        (x) => x !== null || x != undefined,
        () => ({ type: ErrorType.NotFound, error: `not found` })
      ),
      RTE.fold<HandlerContext<Ctx>, AppError, T, unknown>(
        errorHandler,
        successHandler
      ),
      I.ap<HandlerContext<Ctx>>({ handlerParams: [req, res, next], context })
    )();
