// Converte os JSONs desta pasta para o formato de código do n8n Workflow SDK
// (usado para criar os fluxos direto no n8n pela conexão MCP).
// Uso: node fluxos/gerador/para-sdk.js  → grava fluxos/sdk/*.ts

const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..");
const out = path.join(dir, "sdk");
fs.mkdirSync(out, { recursive: true });

const ident = nome => "n_" + nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");

// Serializa parâmetros trocando "={{ … }}" por expr("{{ … }}").
let seq = 0;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function ser(v) {
  if (Array.isArray(v)) return "[" + v.map(x => ser(x)).join(", ") + "]";
  if (v && typeof v === "object") {
    return "{ " + Object.keys(v).map(k => (/^[A-Za-z_]\w*$/.test(k) ? k : JSON.stringify(k)) + ": " + (k === "id" && UUID.test(v[k]) ? JSON.stringify("c" + (++seq)) : ser(v[k]))).join(", ") + " }";
  }
  if (typeof v === "string" && v.startsWith("=") && v.includes("{{")) return "expr(" + JSON.stringify(v.slice(1)) + ")";
  return JSON.stringify(v);
}

function credenciais(c) {
  if (!c) return null;
  return "{ " + Object.entries(c).map(([tipo, v]) => JSON.stringify(tipo) + ": newCredential(" + JSON.stringify(v.name) + ")").join(", ") + " }";
}

for (const arq of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const w = JSON.parse(fs.readFileSync(path.join(dir, arq), "utf8"));
  const tipos = Object.fromEntries(w.nodes.map(n => [n.name, n.type]));
  const decl = [];
  const stickies = [];
  for (const n of w.nodes) {
    if (n.type === "n8n-nodes-base.stickyNote") {
      stickies.push("sticky(" + JSON.stringify(n.parameters.content) + ", [], { position: " + JSON.stringify(n.position) + ", width: " + n.parameters.width + ", height: " + n.parameters.height + " })");
      continue;
    }
    const linhas = ["name: " + JSON.stringify(n.name), "parameters: " + ser(n.parameters), "position: " + JSON.stringify(n.position)];
    const cr = credenciais(n.credentials);
    if (cr) linhas.push("credentials: " + cr);
    if (n.executeOnce) linhas.push("executeOnce: true");
    if (n.onError) linhas.push("onError: " + JSON.stringify(n.onError));
    if (n.alwaysOutputData) linhas.push("alwaysOutputData: true");
    const cfg = "{\n    " + linhas.join(",\n    ") + "\n  }";
    let fab;
    if (n.type === "n8n-nodes-base.if") fab = "ifElse({ version: " + n.typeVersion + ", config: " + cfg + " })";
    else if (n.type === "n8n-nodes-base.splitInBatches") fab = "splitInBatches({ version: " + n.typeVersion + ", config: " + cfg + " })";
    else if (/Trigger$/.test(n.type)) fab = "trigger({ type: " + JSON.stringify(n.type) + ", version: " + n.typeVersion + ", config: " + cfg + " })";
    else fab = "node({ type: " + JSON.stringify(n.type) + ", version: " + n.typeVersion + ", config: " + cfg + " })";
    decl.push("const " + ident(n.name) + " = " + fab + ";");
  }

  // Ligações
  const passos = [];
  const destino = (de, alvo) => tipos[alvo] === "n8n-nodes-base.splitInBatches" && tipos[de] !== "n8n-nodes-base.splitInBatches" && !/Trigger$|scheduleTrigger|set$/.test(tipos[de]) && w._entradaLoop?.[alvo] !== de
    ? "nextBatch(" + ident(alvo) + ")" : ident(alvo);
  // primeira entrada de cada loop (quem alimenta o loop pela primeira vez) não é nextBatch
  const entradas = {};
  for (const [de, c] of Object.entries(w.connections)) for (const s of c.main) for (const l of s) (entradas[l.node] ||= []).push(de);
  w._entradaLoop = {};
  for (const n of w.nodes) if (n.type === "n8n-nodes-base.splitInBatches") w._entradaLoop[n.name] = entradas[n.name][0];

  for (const [de, c] of Object.entries(w.connections)) {
    const t = tipos[de];
    c.main.forEach((saida, i) => {
      for (const l of saida) {
        const alvo = destino(de, l.node);
        if (t === "n8n-nodes-base.if") passos.push(ident(de) + (i === 0 ? ".onTrue(" : ".onFalse(") + alvo + ")");
        else if (t === "n8n-nodes-base.splitInBatches") passos.push(ident(de) + (i === 0 ? ".onDone(" : ".onEachBatch(") + alvo + ")");
        else passos.push(ident(de) + ".to(" + alvo + ")");
      }
    });
  }
  const corpo = [
    "import { workflow, node, trigger, sticky, newCredential, ifElse, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';",
    "",
    ...decl,
    "",
    "export default workflow(" + JSON.stringify(arq.replace(".json", "")) + ", " + JSON.stringify(w.name) + ")",
    ...passos.map(p => "  .add(" + p + ")"),
    ...stickies.map(s => "  .add(" + s + ")"),
    ";",
  ].join("\n");
  fs.writeFileSync(path.join(out, arq.replace(".json", ".ts")), corpo + "\n");
  console.log(arq, "→", corpo.length, "caracteres");
}
