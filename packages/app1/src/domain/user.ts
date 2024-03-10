import * as t from "io-ts";
import type { UserDecoder } from "../decoders/user";

export type User = t.TypeOf<typeof UserDecoder>;
