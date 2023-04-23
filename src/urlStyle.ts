import { ulidFactory } from "ulid-workers";
import { Styles } from "common/build/main";
import emojis from "./emojis.json" assert { type: "json" };

/* Some code was copied from  https://github.com/tycrek/ass */

const lengthGen = (length: number, charset: string[]): string =>
  [...crypto.getRandomValues(new Uint8Array(length + 5))]
    .map((byte) => charset[Number(byte) % charset.length])
    .join("")
    .slice(0, length);

const defChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
const def = ({ length }: { length: number }) => lengthGen(length, defChars);

const emoji = ({ length }: { length: number }) => lengthGen(length, emojis);

//TODO: maybe gfycat
export function genVanity(style: Styles, length = 8): string {
  switch (style) {
    case Styles.default:
      return def({ length });
    case Styles.uuid:
      return crypto.randomUUID();
    case Styles.timestamp:
      return `${Date.now()}`;
    case Styles.ulid:
      if (!globalThis.ulid) {
        globalThis.ulid = ulidFactory();
      }
      return ulid();
    case Styles.emoji:
      return emoji({ length });
    case Styles.filename:
      return undefined as unknown as string;
  }
}
