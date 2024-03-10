import { createRequestHandler } from "@darkruby/fp-express";
import * as amqplib from "amqplib";
import bodyParser from "body-parser";
import { Database } from "bun:sqlite";
import { default as express } from "express";
import { pipe } from "fp-ts/lib/function";
import { enqueueUser } from "./rabbit";
import { createUser, getUserById } from "./services";

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
