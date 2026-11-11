# TV Attual — Integração reversível no WordPress

Não publicar o player no WordPress até que o host live.tvattual.com.br esteja com DNS, HTTPS e testes OBS concluídos. Não editar core, substituir Elementor ou instalar plugin extra. Usar página nova com um bloco HTML:

```html
<div style="width:100%;max-width:1100px;margin:auto;aspect-ratio:16/9">
  <iframe title="TV Attual ao vivo" src="https://live.tvattual.com.br/"
    loading="lazy" allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen referrerpolicy="strict-origin-when-cross-origin"
    style="display:block;border:0;width:100%;height:100%;border-radius:12px">
  </iframe>
</div>
```

Aplicar somente a marca oficial homologada. Testar mobile, HTTPS, CSP, teclado, áudio e fora do ar.
