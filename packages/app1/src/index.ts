import {
  ErrorType,
  createRequestHandler,
  type AppError,
  type HandlerTask,
} from "@darkruby/fp-express";
import bodyParser from "body-parser";
import { Database } from "bun:sqlite";
import { default as express } from "express";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

// usage here...
type User = { id: number; name: string };

const createUser: HandlerTask<User, Database> = ({
  handlerParams: [req],
  context: db,
}) =>
  TE.tryCatch<AppError, User>(
    async () => {
      const user: User = req.body;
      db.exec(`insert into 'user' values(?, ?)`, [user.id, user.name]);
      return user;
    },
    (err) => ({ type: ErrorType.BadRequest, error: (err as Error).message })
  );

const getUserById: HandlerTask<User, Database> = ({
  handlerParams: [req],
  context: db,
}) =>
  TE.tryCatch(
    async () =>
      db.query(`select * from 'user' where id=?`).get(req.params.id) as User,
    (err) => ({ type: ErrorType.General, error: (err as Error).message })
  );

const app = express();
app.use(bodyParser.json());

const db = new Database();

const createUserHandler = pipe(createUser, createRequestHandler(db));
const userByIdHandler = pipe(getUserById, createRequestHandler(db));

db.exec("create table user (id int primary key, name string not null)");
// db.exec("insert into user values(123, 'art')");

app.post("/api/user/", createUserHandler);
app.get("/api/user/:id", userByIdHandler);

app.listen(8099, () => console.log("listening"));

// curl -X POST -H "Content-Type: application/json" -d '{"name": "art", "id": "123"}' http://localhost:8099/api/user/
