import { map, some } from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";

const aaa = pipe(
  some(123),
  map((x) => x * 2)
);

export default aaa;
