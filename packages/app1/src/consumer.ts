import * as amqplib from "amqplib";

const connection = await amqplib.connect("amqp://127.0.0.1");
const channel = await connection.createChannel();
// await channel.assertExchange("my_exchange", "direct", { durable: true });
// await channel.assertQueue("my_queue", { durable: true });

channel.consume("my_queue", (payload) => {
  if (payload) {
    const user = JSON.stringify(payload.content.toString("utf8"));
    console.log(user);
    channel.ack(payload);
  }
});
