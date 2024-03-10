import { badRequest, type AppError } from "@darkruby/fp-express";
import * as A from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { flow, pipe, type FunctionN } from "fp-ts/lib/function";
import * as t from "io-ts";

export const UserDecoder = t.type({
  id: t.number,
  name: t.string,
});

export const liftE = <A>(
  decoder: t.Decoder<unknown, A>
): FunctionN<[unknown], E.Either<AppError, A>> =>
  flow(
    decoder.decode,
    E.mapLeft((errs) =>
      badRequest({
        message: pipe(
          errs,
          A.map((e) => e.message ?? `Schema<${decoder.name}> error.`)
        ).join(""),
      })
    )
  );

export const liftTE = <R, A>(
  decoder: t.Decoder<unknown, A>
): FunctionN<[unknown], TE.TaskEither<AppError, A>> =>
  flow(liftE(decoder), TE.fromEither);

export const liftRTE = <R, A>(
  decoder: t.Decoder<unknown, A>
): FunctionN<[unknown], RTE.ReaderTaskEither<R, AppError, A>> =>
  flow(liftE(decoder), RTE.fromEither);
