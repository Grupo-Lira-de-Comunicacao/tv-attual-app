// ============================================
// Links oficiais — TV Attual / Attual Play
// Centralize AQUI todos os links. Nenhum outro
// arquivo precisa ser editado quando um link mudar.
// ============================================

export const LINKS = {
  SITE_URL: "https://tvattual.com.br/",

  // TV ao vivo — stream tocado dentro do app e link direto para nova aba
  TV_STREAM_URL: "https://tv.tvattual.com.br/iptv/channel/1.m3u8",
  TV_DIRECT_PLAYER_URL: "https://tv.tvattual.com.br/iptv/channel/1.m3u8",

  // --- Referência técnica interna (NÃO exibir no app para o público) ---
  // Painel de administração da TV: https://tv.tvattual.com.br/
  // Playlist completa de canais:  https://tv.tvattual.com.br/iptv/channels.m3u

  RADIO_EMBED_URL: "https://radio.tvattual.com.br/public/r%C3%A1dio_attual/embed",
  RADIO_STREAM_URL: "https://radio.tvattual.com.br/listen/r%C3%A1dio_attual/radio.mp3",

  TIKTOK_URL: "https://www.tiktok.com/@attualplayoficial",
  INSTAGRAM_URL: "https://www.instagram.com/attualplay",
  FACEBOOK_URL: "https://www.facebook.com/attualplay",
  YOUTUBE_URL: "https://www.youtube.com/@AttualPlay",
  WHATSAPP_URL: "https://api.whatsapp.com/send?phone=5511987080279"
};

// Verdadeiro quando o link está preenchido com um valor real
export function linkConfigurado(url) {
  return Boolean(url) && !url.startsWith("COLE_AQUI");
}
