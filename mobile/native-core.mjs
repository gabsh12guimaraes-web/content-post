export function nomeSeguro(name) {
  return String(name || 'post')
    .replace(/[\\/\u0000-\u001f\u007f]/g, '_')
    .replace(/^\.+/, '')
    .slice(-140) || 'post';
}

function base64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível preparar o arquivo.'));
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

export function criarIntegracao({ ativo, Browser, Filesystem, Share, cache, codificar = base64 }) {
  let salvando = false;
  return {
    ativo,
    urlExterna(value) {
      try { return new URL(String(value)).protocol === 'https:'; }
      catch { return false; }
    },
    async abrirURL(url) {
      if (!this.urlExterna(url)) throw new Error('Este link precisa usar HTTPS.');
      await Browser.open({ url: String(url), presentationStyle: 'fullscreen' });
    },
    async salvarBlob(blob, name) {
      if (salvando) throw new Error('Conclua o compartilhamento do arquivo anterior.');
      salvando = true;
      const path = `compartilhar/${crypto.randomUUID()}/${nomeSeguro(name)}`;
      let gravou = false;
      try {
        await Filesystem.writeFile({ path, directory: cache, recursive: true, data: await codificar(blob) });
        gravou = true;
        const { uri } = await Filesystem.getUri({ path, directory: cache });
        try {
          await Share.share({ title: nomeSeguro(name), files: [uri], dialogTitle: 'Salvar ou compartilhar' });
        } catch (error) {
          // Cancelar a folha nativa não deve disparar o fallback que abre a mídia.
          if (error?.message !== 'Share canceled') throw error;
        }
      } finally {
        // Arquivos temporários não guardam cópias de publicações de outras
        // organizações depois que o compartilhamento termina ou é cancelado.
        if (gravou) await Filesystem.deleteFile({ path, directory: cache }).catch(() => {});
        salvando = false;
      }
    },
  };
}
