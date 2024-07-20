import { createRequestHandler } from "@darkruby/fp-express";
import * as amqplib from "amqplib";
import bodyParser from "body-parser";
import { Database } from "bun:sqlite";
import type { RequestHandler } from "express";
import { default as express } from "express";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { createUser, getUserById } from "./services/database";
import { enqueueUser } from "./services/rabbit";

const db = (() => {
  const db = new Database();
  db.exec("create table user (id int primary key, name string not null)");
  db.exec("insert into user values(123, 'art')");
  return db;
})();

const channel = await (async () => {
  const connection = await amqplib.connect("amqp://127.0.0.1");
  const channel = await connection.createChannel();
  await channel.assertExchange("my_exchange", "direct", { durable: true });
  await channel.assertQueue("my_queue", { durable: true });
  channel.consume("my_queue", async (payload) => {
    if (payload) {
      const user = JSON.parse(payload.content.toString("utf8"));
      await pipe(
        createUser({
          params: [{ body: user }] as unknown as Parameters<RequestHandler>,
          context: { db },
        }),
        TE.chain((_) => TE.fromIO(() => channel.ack(payload)))
      )();
    }
  });
  return channel;
})();

const ctx = { db, channel };

const enqueueUserHandler = pipe(enqueueUser, createRequestHandler(ctx));
const createUserHandler = pipe(createUser, createRequestHandler(ctx));
const userByIdHandler = pipe(getUserById, createRequestHandler(ctx));

const app = express();
app.use(bodyParser.json());

app.post("/api/q/user", enqueueUserHandler);
app.post("/api/user", createUserHandler);
app.get("/api/user/:id", userByIdHandler);

const port = process.env.PORT ?? 8099;
app.listen(port, () => console.log(`Listening on ${port}`));

/* 
curl -X POST -H "Content-Type: application/json" -d \
 '{"name": "art", "id": "123"}' http://localhost:8099/api/user/
*/
