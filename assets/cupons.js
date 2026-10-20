// Copia o código sem abrir o checkout nem perder o ciclo escolhido.
document.addEventListener("click", async e => {
  const b = e.target.closest("button[data-cupom]"); if (!b) return;
  const codigo = b.dataset.cupom, anterior = b.innerHTML;
  let copiado = false;
  try { await navigator.clipboard.writeText(codigo); copiado = true; }
  catch {
    const campo = document.createElement("textarea"); campo.value = codigo;
    campo.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(campo); campo.select();
    try { copiado = document.execCommand("copy"); } catch {}
    campo.remove(); b.focus({ preventScroll: true });
  }
  b.textContent = copiado ? "Cupom copiado!" : codigo + " · selecione para copiar";
  setTimeout(() => { if (b.isConnected) b.innerHTML = anterior; }, 2500);
});
