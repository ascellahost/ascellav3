import { ulidFactory } from "ulid-workers";
import { Styles } from "common/build/main";
import emojis from "./emojis.json" assert { type: "json" };

/* Some code was copied from  https://github.com/tycrek/ass */

const ulid = ulidFactory();

const lengthGen = (length: number, charset: string[]): string =>
  [...crypto.getRandomValues(new Uint8Array(length + 5))].map((byte) =>
    charset[Number(byte) % charset.length]
  )
    .join("").slice(0, length);

const zeroWidthChars = ["\u200B", "\u200C", "\u200D", "\u2060"];

const zws = ({ length }: { length: number }) =>
  lengthGen(length, zeroWidthChars);

const defChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    .split("");
const def = ({ length }: { length: number }) => lengthGen(length, defChars);

const emoji = ({ length }: { length: number }) => lengthGen(length, emojis);

//TODO: maybe gfycat
export function genVanity(style: Styles, length = 8): string {
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
      return undefined as unknown as string;
  }
}
