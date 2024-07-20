import { fromTryCatch, type HandlerTask } from "@darkruby/fp-express";
import * as amqplib from "amqplib";
import type { User } from "../domain/user";

export type RabbitMqCtx = {
  channel: amqplib.Channel;
};

export const enqueueUser: HandlerTask<boolean, RabbitMqCtx> = fromTryCatch(
  async ({ context: { channel }, params: [req] }) => {
    const user: User = req.body;
    return channel.sendToQueue("my_queue", Buffer.from(JSON.stringify(user)));
  }
);
