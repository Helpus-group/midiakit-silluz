/* Mídia kit SILLUZ: tudo que muda mora aqui. Só entra o que o DJ informou. */
window.SITE = {
  nome: "SILLUZ",

  whatsapp: {
    numero: "5531992282642",
    mensagem: "Olá! Quero consultar uma data com o Silluz.",
  },

  contato: { email: "contatosilluz@gmail.com" },

  frames: {
    total: 160,
    desktop: "assets/frames/desktop/f_{n}.webp",
    mobile: "assets/frames/mobile/f_{n}.webp",
  },

  numeros: [], // artista em início: sem números (decisão da usuária)

  /* Lançamentos: capa + "Ouvir aqui" (player na página) + Spotify */
  lancamentos: [
    { faixa: "Luxo", artistas: "Silluz", capa: "assets/capas/luxo.webp", link: "https://open.spotify.com/track/7hJda4h1vOpwPHuZ6fuh3H" },
    { faixa: "Higher", artistas: "Silluz", capa: "assets/capas/higher.webp", link: "https://open.spotify.com/track/2cWvs5CrM7HcGtYTrwhbrr" },
    { faixa: "Sweet Escape", artistas: "Silluz", capa: "assets/capas/sweet-escape.webp", link: "https://open.spotify.com/track/6IldEFynbUwxI6KMKOpr66" },
    { faixa: "Viola", artistas: "Silluz", capa: "assets/capas/viola.webp", link: "https://open.spotify.com/track/5BmXCXx7a38TehE4rcGwBe" },
  ],
  ouvirTudo: { rotulo: "Ouvir tudo no Spotify", url: "https://open.spotify.com/artist/2FcuWxGriKYSIlrkskySDu" },

  videos: [],
  rider: [],

  /* Onde já tocou */
  palcos: {
    festas: ["House Sessions", "Hit & Run", "No Signal BH", "The Roof", "D.HAUZ"],
  },

  redes: [
    { rede: "instagram", rotulo: "@silluz___", url: "https://www.instagram.com/silluz___/" },
    { rede: "spotify", rotulo: "Silluz", url: "https://open.spotify.com/artist/2FcuWxGriKYSIlrkskySDu" },
    { rede: "soundcloud", rotulo: "silluz", url: "https://soundcloud.com/silluz" },
    { rede: "youtube", rotulo: "Silluz", url: "https://www.youtube.com/channel/UCB1TEy6V7IxhSx8-QAwp1dQ" },
  ],

  downloads: {
    pdf: "",
    fotos: "https://drive.google.com/drive/folders/1NL2g_ctIDM-V8WxIAiFIVdtXT-EdSx4l?usp=share_link", // botão "Presskit"
  },
};
