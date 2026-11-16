// PostToolUse hook: rejects edits that introduce an em dash (U+2014).
// Exit code 2 sends stderr back to Claude so it fixes the text itself.

const EM_DASH = "\u2014";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const input = payload?.tool_input ?? {};
const written = [
  input.content,
  input.new_string,
  ...(Array.isArray(input.edits) ? input.edits.map((e) => e?.new_string) : []),
].filter((s) => typeof s === "string");

const offending = written
  .flatMap((text) => text.split(/\r?\n/))
  .filter((line) => line.includes(EM_DASH));

if (offending.length === 0) process.exit(0);

const file = input.file_path ?? "the file";
const sample = offending.slice(0, 5).map((l) => `  ${l.trim()}`).join("\n");
process.stderr.write(
  `Em dash found in what you just wrote to ${file}. Rephrase these lines with a period, comma, colon, semicolon, or parentheses (not a hyphen or en dash):\n${sample}\n`,
);
process.exit(2);
