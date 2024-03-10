import {
  generalError,
  type AppError,
  type HandlerTask,
} from "@darkruby/fp-express";
import { Database } from "bun:sqlite";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { UserDecoder, liftTE } from "./decoders/user";
import type { User } from "./domain/user";

export type DatabaseCtx = {
  db: Database;
};

export const createUser: HandlerTask<User, DatabaseCtx> = ({
  params: [req],
  context: { db },
}) =>
  pipe(
    req.body,
    liftTE(UserDecoder),
    TE.chainFirst((user) =>
      TE.tryCatch<AppError, unknown>(async () => {
        db.exec(`insert into 'user' values(?, ?)`, [user.id, user.name]);
      }, generalError)
    )
  );

export const getUserById: HandlerTask<User, DatabaseCtx> = ({
  params: [req],
  context: { db },
}) =>
  pipe(
    TE.tryCatch(
      async () =>
        db.query(`select * from 'user' where id=?`).get(req.params.id),
      generalError
    ),
    TE.chain(liftTE(UserDecoder))
  );
