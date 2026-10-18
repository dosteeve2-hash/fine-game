import { art, gameIconAuthors, type ArtName } from "./icons.generated";

export interface CreditItem {
  name: ArtName;
  label: string;
  author: string;
  url: string;
}

export interface CreditSource {
  id: "gameIcons" | "noto" | "fluent" | "mdi" | "lorelei" | "dicebear" | "lucide" | "fonts" | "sound";
  title: string;
  owner: string;
  license: string;
  licenseUrl: string;
  url: string;
  items: CreditItem[];
}

const authorNames: Record<string, string> = {
  lorc: "Lorc",
  delapouite: "Delapouite",
  quoting: "Quoting",
  faithtoken: "Faithtoken",
  skoll: "Skoll"
};

function pretty(slug: string): string {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function itemsOf(prefix: string, author: string, url: (slug: string) => string): CreditItem[] {
  return (Object.keys(art) as ArtName[])
    .filter(name => name.startsWith(`${prefix}:`))
    .map(name => {
      const slug = name.slice(prefix.length + 1);
      return { name, label: pretty(slug), author, url: url(slug) };
    });
}

const gameIcons: CreditItem[] = (Object.keys(art) as ArtName[])
  .filter(name => name.startsWith("game-icons:"))
  .map(name => {
    const slug = name.slice("game-icons:".length);
    const author = gameIconAuthors[name] ?? "lorc";
    return { name, label: pretty(slug), author: authorNames[author] ?? pretty(author), url: `https://game-icons.net/1x1/${author}/${slug}.html` };
  });

export const credits: CreditSource[] = [
  {
    id: "gameIcons",
    title: "Game-icons.net",
    owner: "Lorc, Delapouite, Quoting, Faithtoken, Skoll",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    url: "https://game-icons.net",
    items: gameIcons
  },
  {
    id: "noto",
    title: "Noto Emoji",
    owner: "Google",
    license: "Apache 2.0",
    licenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
    url: "https://github.com/googlefonts/noto-emoji",
    items: itemsOf("noto", "Google", () => "https://github.com/googlefonts/noto-emoji")
  },
  {
    id: "fluent",
    title: "Fluent Emoji Flat",
    owner: "Microsoft",
    license: "MIT",
    licenseUrl: "https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE",
    url: "https://github.com/microsoft/fluentui-emoji",
    items: itemsOf("fluent-emoji-flat", "Microsoft", () => "https://github.com/microsoft/fluentui-emoji")
  },
  {
    id: "mdi",
    title: "Material Design Icons",
    owner: "Pictogrammers",
    license: "Apache 2.0",
    licenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
    url: "https://pictogrammers.com/library/mdi/",
    items: itemsOf("mdi", "Pictogrammers", slug => `https://pictogrammers.com/library/mdi/icon/${slug}/`)
  },
  {
    id: "lorelei",
    title: "Lorelei (Fina)",
    owner: "Lisa Wischofsky",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    url: "https://www.dicebear.com/styles/lorelei/",
    items: []
  },
  {
    id: "dicebear",
    title: "DiceBear",
    owner: "Florian Körner",
    license: "MIT",
    licenseUrl: "https://github.com/dicebear/dicebear/blob/main/LICENSE",
    url: "https://www.dicebear.com",
    items: []
  },
  {
    id: "lucide",
    title: "Lucide",
    owner: "Lucide Contributors",
    license: "ISC",
    licenseUrl: "https://lucide.dev/license",
    url: "https://lucide.dev",
    items: []
  },
  {
    id: "fonts",
    title: "Playfair Display · Outfit · JetBrains Mono",
    owner: "Claus Eggers Sørensen · Rodrigo Fuenzalida · JetBrains",
    license: "SIL Open Font License 1.1",
    licenseUrl: "https://openfontlicense.org",
    url: "https://fonts.google.com",
    items: []
  },
  {
    id: "sound",
    title: "FINE",
    owner: "Steve Donald Compaoré",
    license: "©",
    licenseUrl: "https://fine-game-three.vercel.app",
    url: "https://fine-game-three.vercel.app",
    items: []
  }
];
