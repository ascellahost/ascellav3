import { ulidFactory } from "ulid-workers";
import emojis from "./emojis.json" assert { type: "json" };
const ulid = ulidFactory();

const lengthGen = (length: number, charset: string[]): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => charset[Number(byte) % charset.length])
    .join("").slice(1).concat(charset[0]);
};

const zeroWidthChars = ["\u200B", "\u200C", "\u200D", "\u2060"];
const zws = ({ length }: { length: number }) =>
  lengthGen(length, zeroWidthChars);

const defChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    .split("");
const def = ({ length }: { length: number }) => lengthGen(length, defChars);

const emoji = ({ length }: { length: number }) => lengthGen(length, emojis);

export enum Styles {
  default = 0,
  uuid = 1,
  zws = 2,
  ulid = 3,
  emoji = 4,
  filename = 5,
}
//TODO: maybe gfycat
export function genVanity(style: Styles, length = 8) {
  switch (style) {
    case Styles.default:
      return def({ length });
    case Styles.uuid:
      return crypto.randomUUID();
    case Styles.zws:
      return zws({ length });
    case Styles.ulid:
      return ulid();
    case Styles.emoji:
      return emoji({ length });
    case Styles.filename:
      return undefined;
  }
}
