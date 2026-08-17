// 詞法分析：把運算式字串切成 token 陣列，並拒絕白名單以外的字元。

const OPERATORS = new Set(["+", "-", "*", "/", "%", "^"]);

const FULLWIDTH_MAP = {
  "（": "(",
  "）": ")",
  "＋": "+",
  "－": "-",
  "×": "*",
  "＊": "*",
  "÷": "/",
  "／": "/",
  "％": "%",
  "＾": "^",
};

const isDigit = (ch) => ch >= "0" && ch <= "9";

/** LLM 常送出全形符號或千分位逗號，先正規化可減少無謂的重試。 */
export function normalize(input) {
  return String(input)
    .replace(/[（）＋－×＊÷／％＾]/g, (ch) => FULLWIDTH_MAP[ch])
    .replace(/(?<=\d),(?=\d{3}(\D|$))/g, "")
    .trim();
}

export function tokenize(input) {
  const source = normalize(input);
  const tokens = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    // 1) 空白：直接略過
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // 2) 數字：一次吃掉連續的數字與小數點
    if (isDigit(ch) || (ch === "." && isDigit(source[i + 1]))) {
      const start = i;
      let seenDot = false;
      while (i < source.length && (isDigit(source[i]) || source[i] === ".")) {
        if (source[i] === ".") {
          if (seenDot) throw new SyntaxError(`數字格式錯誤：位置 ${i} 有多餘的小數點`);
          seenDot = true;
        }
        i++;
      }
      tokens.push({ type: "number", value: Number(source.slice(start, i)), pos: start });
      continue;
    }

    // 3) ** 視為 ^，因為模型常用 JavaScript 寫法
    if (ch === "*" && source[i + 1] === "*") {
      tokens.push({ type: "op", value: "^", pos: i });
      i += 2;
      continue;
    }

    // 4) 單一字元的運算子與括號
    if (OPERATORS.has(ch)) {
      tokens.push({ type: "op", value: ch, pos: i });
      i++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ type: ch === "(" ? "lparen" : "rparen", value: ch, pos: i });
      i++;
      continue;
    }

    // 5) 白名單以外一律拒絕
    throw new SyntaxError(`不支援的字元「${ch}」（位置 ${i}）`);
  }

  return tokens;
}
