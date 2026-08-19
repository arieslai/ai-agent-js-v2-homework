// 語法分析 + 求值：遞迴下降，每個函式對應一條文法規則。
//
//   expression := term    ( ('+' | '-')       term  )*
//   term       := unary   ( ('*' | '/' | '%') unary )*
//   unary      := ('+' | '-') unary | power
//   power      := primary ( '^' unary )?          右結合
//   primary    := NUMBER | '(' expression ')'

import { tokenize } from "./tokenizer.js";

const MAX_LENGTH = 200;

export function evaluate(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new SyntaxError("運算式不可為空");
  }
  if (input.length > MAX_LENGTH) {
    throw new SyntaxError(`運算式過長（上限 ${MAX_LENGTH} 字元）`);
  }

  const tokens = tokenize(input);
  if (tokens.length === 0) throw new SyntaxError("運算式不可為空");

  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const matchOp = (...values) => peek()?.type === "op" && values.includes(peek().value);

  function expect(type, label) {
    const token = peek();
    if (!token || token.type !== type) {
      throw new SyntaxError(`預期 ${label}，但遇到「${token?.value ?? "運算式結尾"}」`);
    }
    return next();
  }

  function parseExpression() {
    let left = parseTerm();
    while (matchOp("+", "-")) {
      const op = next().value;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parseUnary();
    while (matchOp("*", "/", "%")) {
      const op = next().value;
      const right = parseUnary();
      if (right === 0 && (op === "/" || op === "%")) throw new RangeError("除數不可為 0");
      left = op === "*" ? left * right : op === "/" ? left / right : left % right;
    }
    return left;
  }

  function parseUnary() {
    if (matchOp("+", "-")) {
      const op = next().value;
      const value = parseUnary();
      return op === "-" ? -value : value;
    }
    return parsePower();
  }

  function parsePower() {
    const base = parsePrimary();
    // 呼叫 parseUnary 而非 parsePower，才能讓 2^-1 與 2^3^2 都成立（右結合）
    if (matchOp("^")) {
      next();
      return base ** parseUnary();
    }
    return base;
  }

  function parsePrimary() {
    const token = peek();
    if (!token) throw new SyntaxError("運算式不完整");

    if (token.type === "number") return next().value;

    if (token.type === "lparen") {
      next();
      const value = parseExpression();
      expect("rparen", "右括號 )");
      return value;
    }

    throw new SyntaxError(`不合法的語法：「${token.value}」（位置 ${token.pos}）`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new SyntaxError(`多餘的內容：「${tokens[pos].value}」（位置 ${tokens[pos].pos}）`);
  }
  if (!Number.isFinite(result)) throw new RangeError("計算結果超出可表示範圍");

  // 消除 0.1 + 0.2 = 0.30000000000000004 這類浮點雜訊。
  // 整數結果不做修正，否則 12345678 * 87654321 會被截成錯誤答案。
  // 取 15 位有效數字（double 可靠有效位數約 15.95），避免 123456789012.5
  // 這類數值的真實有效數字被截掉。
  if (Number.isInteger(result)) return result;
  return Number(result.toPrecision(15));
}
