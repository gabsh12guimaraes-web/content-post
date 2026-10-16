// Confere os JSONs gerados: conexões apontam para nós que existem, todo nó está ligado,
// o código dos nós Code compila e as expressões {{ }} estão balanceadas.
// Uso: node fluxos/gerador/validar-fluxos.js

const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..");
let erros = 0;
const falha = (arq, msg) => { erros++; console.log("  ✗ " + arq + ": " + msg); };

for (const arq of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const w = JSON.parse(fs.readFileSync(path.join(dir, arq), "utf8"));
  const nomes = new Set(w.nodes.map(n => n.name));
  const recebe = new Set();
  for (const [de, c] of Object.entries(w.connections)) {
    if (!nomes.has(de)) falha(arq, "conexão sai de nó inexistente: " + de);
    for (const saida of c.main) for (const l of saida) {
      if (!nomes.has(l.node)) falha(arq, "conexão para nó inexistente: " + l.node);
      recebe.add(l.node);
    }
  }
  for (const n of w.nodes) {
    const gatilho = /Trigger$|scheduleTrigger/.test(n.type);
    if (n.type.endsWith("stickyNote")) continue;
    if (!gatilho && !recebe.has(n.name)) falha(arq, "nó sem entrada: " + n.name);
    if (n.type === "n8n-nodes-base.code") {
      try { new Function("$input", "$json", "$", "$runIndex", n.parameters.jsCode); }
      catch (e) { falha(arq, "código não compila em \"" + n.name + "\": " + e.message); }
    }
    const visitar = v => {
      if (Array.isArray(v)) return v.forEach(visitar);
      if (v && typeof v === "object") return Object.values(v).forEach(visitar);
      if (typeof v !== "string" || !v.startsWith("=")) return;
      const abre = (v.match(/\{\{/g) || []).length, fecha = (v.match(/\}\}/g) || []).length;
      if (abre !== fecha) falha(arq, "expressão desbalanceada em \"" + n.name + "\"");
      const m = v.match(/^=\{\{([\s\S]*)\}\}$/);
      if (m && abre === 1) {
        try { new Function("$json", "$", "$runIndex", "return (" + m[1] + ")"); }
        catch (e) { falha(arq, "expressão inválida em \"" + n.name + "\": " + e.message); }
      }
    };
    visitar(n.parameters);
  }
  console.log((erros ? "…" : "✓") + " " + arq + " (" + w.nodes.length + " nós)");
}
console.log(erros ? erros + " problema(s)" : "Tudo certo.");
process.exit(erros ? 1 : 0);
