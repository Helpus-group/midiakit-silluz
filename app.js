(() => {
  const S = window.SITE || {};
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = matchMedia("(max-width: 760px)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const h = (tag, attrs = {}, ...filhos) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "texto") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const f of filhos.flat()) if (f != null && f !== "") el.append(f);
    return el;
  };
  const icone = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3 1.5v13L14 8z"/></svg>',
  };
  const aviso = (() => {
    const el = h("div", { class: "aviso", role: "status" });
    document.body.append(el);
    let t;
    return (txt) => { el.textContent = txt; el.classList.add("mostrar"); clearTimeout(t); t = setTimeout(() => el.classList.remove("mostrar"), 2200); };
  })();
  const copiar = async (txt, msg) => {
    try { await navigator.clipboard.writeText(txt); aviso(msg); }
    catch { prompt("Copie:", txt); }
  };

  /* ── Rolagem que toca o vídeo ─────────────────────────────────────────── */
  const cine = $(".cine");
  const canvas = cine && $(".cine-canvas", cine);
  if (cine && canvas && S.frames && S.frames.total) {
    const ctx = canvas.getContext("2d");
    const total = S.frames.total;
    const padrao = celular ? S.frames.mobile : S.frames.desktop;
    const src = (i) => padrao.replace("{n}", String(i + 1).padStart(4, "0"));
    const quadros = new Array(total);
    cine.style.setProperty("--capa", `url("${src(0)}")`); // 1º quadro: fundo enquanto carrega e capa do PDF
    const momentos = $$(".momento", cine);
    let alvo = 0, atual = 0, desenhado = -1;

    const carregar = (i) => {
      if (quadros[i]) return quadros[i];
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      img.onload = () => { if (Math.round(atual) === i || desenhado === -1) desenhar(i, true); };
      return (quadros[i] = img);
    };
    carregar(0);
    if (!reduzir) {
      const fila = [];
      for (const passo of [8, 4, 2, 1]) for (let i = 0; i < total; i += passo) if (!fila.includes(i)) fila.push(i);
      let k = 0;
      const lote = () => { for (let n = 0; n < 6 && k < fila.length; n++) carregar(fila[k++]); if (k < fila.length) setTimeout(lote, 40); };
      lote();
    }
    const pronto = (i) => quadros[i] && quadros[i].complete && quadros[i].naturalWidth;
    const maisProximo = (i) => {
      for (let d = 0; d < total; d++) { if (pronto(i - d)) return i - d; if (pronto(i + d)) return i + d; }
      return -1;
    };
    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      desenhado = -1;
      desenhar(Math.round(atual), true);
    };
    function desenhar(i, forcar) {
      const j = maisProximo(i);
      if (j < 0 || (j === desenhado && !forcar)) return;
      const img = quadros[j];
      const cw = canvas.width, ch = canvas.height;
      const escala = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * escala, hh = img.naturalHeight * escala;
      ctx.drawImage(img, (cw - w) / 2, (ch - hh) / 2, w, hh);
      desenhado = j;
    }
    const progresso = () => {
      const r = cine.getBoundingClientRect();
      const curso = cine.offsetHeight - innerHeight;
      return Math.min(1, Math.max(0, -r.top / (curso || 1)));
    };
    const atualizarMomentos = (p) => {
      for (const m of momentos) {
        const de = parseFloat(m.dataset.de || 0), ate = parseFloat(m.dataset.ate || 1);
        m.classList.toggle("ativo", p >= de && (p < ate || (ate >= 1 && p >= 1)));
      }
      cine.classList.toggle("andou", p > 0.02);
    };
    const quadro = () => {
      alvo = progresso() * (total - 1);
      atual += (alvo - atual) * 0.18;
      if (Math.abs(alvo - atual) < 0.05) atual = alvo;
      desenhar(Math.round(atual));
      atualizarMomentos(atual / (total - 1));
      requestAnimationFrame(quadro);
    };
    addEventListener("resize", ajustar);
    ajustar();
    if (reduzir) atualizarMomentos(0);
    else requestAnimationFrame(quadro);
  }

  /* ── Some com o que não tem dado (nada de seção vazia) ────────────────── */
  const vazio = (v) => !v || (Array.isArray(v) && v.length === 0);
  const P = S.palcos || {};
  const esconder = { numeros: S.numeros, musica: S.lancamentos, "ao-vivo": S.videos, rider: S.rider };
  for (const [id, dados] of Object.entries(esconder)) {
    if (vazio(dados)) { const sec = document.getElementById(id); if (sec) sec.hidden = true; $$(`.menu a[href="#${id}"]`).forEach((a) => (a.hidden = true)); }
  }
  if (vazio(P.festas) && vazio(P.dividiuLine) && vazio(P.residencias) && vazio(P.eventos)) { document.getElementById("palcos")?.setAttribute("hidden", ""); $$('.menu a[href="#palcos"]').forEach((a) => (a.hidden = true)); }
  if (vazio(P.residencias)) $("[data-bloco=residencias]")?.setAttribute("hidden", "");
  if (vazio(P.eventos)) $("[data-bloco=eventos]")?.setAttribute("hidden", "");

  /* ── 02 Números com contador ──────────────────────────────────────────── */
  const listaNum = $("[data-lista=numeros]");
  if (listaNum && !vazio(S.numeros)) {
    const fmt = (n, dec) => n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    for (const n of S.numeros) {
      const dec = n.decimais ?? (String(n.valor).includes(".") ? String(n.valor).split(".")[1].length : 0);
      const valor = h("span", { class: "numero-valor", "data-valor": n.valor, "data-dec": dec, "data-pre": n.prefixo || "", "data-suf": n.sufixo || "" },
        `${n.prefixo || ""}${fmt(Number(n.valor), dec)}${n.sufixo || ""}`);
      listaNum.append(h("article", { class: "painel numero revelar" }, valor, h("strong", { texto: n.rotulo }), h("span", { texto: n.detalhe || "" })));
    }
    if (!reduzir) {
      const animar = (el) => {
        const alvo = Number(el.dataset.valor), dec = Number(el.dataset.dec), t0 = performance.now(), dur = 1600;
        const passo = (t) => {
          const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          el.textContent = `${el.dataset.pre}${fmt(alvo * e, dec)}${el.dataset.suf}`;
          if (k < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      };
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { animar(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
      $$(".numero-valor", listaNum).forEach((el) => io.observe(el));
    }
  }

  /* ── Player: converte links de plataforma em embed ────────────────────── */
  const embed = (url = "") => {
    let m;
    if ((m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode)\/([A-Za-z0-9]+)/)))
      return { tipo: "inline", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` };
    if (/soundcloud\.com\//.test(url))
      return { tipo: "inline", src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&visual=false&show_comments=false` };
    if ((m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)))
      return { tipo: "tela", largo: !/shorts\//.test(url), src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` };
    return { tipo: "fora", src: url };
  };
  const tela = $(".tela");
  const telaConteudo = tela && $(".tela-conteudo", tela);
  const abrirTela = (conteudo, largo) => {
    if (!tela) return;
    telaConteudo.replaceChildren(conteudo);
    telaConteudo.classList.toggle("largo", !!largo);
    tela.showModal();
  };
  if (tela) {
    const fechar = () => { tela.close(); };
    $(".tela-fechar", tela).addEventListener("click", fechar);
    tela.addEventListener("click", (e) => { if (e.target === tela) fechar(); });
    tela.addEventListener("close", () => telaConteudo.replaceChildren());
  }
  const iframe = (src) => h("iframe", { src, allow: "autoplay; encrypted-media; fullscreen; picture-in-picture", allowfullscreen: true, loading: "lazy", title: "Player" });

  /* ── Lançamentos: capa + "Ouvir aqui" (player na página) + Spotify ───── */
  const listaFaixas = $("[data-lista=lancamentos]");
  if (listaFaixas && !vazio(S.lancamentos)) {
    S.lancamentos.forEach((f, k) => {
      const e = embed(f.link || "");
      const capa = h("div", { class: "capa-quadro" });
      if (f.capa) capa.append(h("img", { src: f.capa, alt: `Capa de ${f.faixa}`, loading: "lazy", width: 640, height: 640 }));
      const player = h("div", { class: "capa-player" });
      const ouvirAqui = h("button", { class: "botao botao--mini", type: "button", "aria-expanded": "false", texto: "Ouvir aqui" });
      const card = h("article", { class: "capa revelar" },
        capa,
        h("div", { class: "capa-info" },
          h("span", { class: "capa-num", texto: String(k + 1).padStart(2, "0") }),
          h("h3", { class: "capa-nome", texto: f.faixa }),
          h("span", { class: "capa-meta", texto: [f.artistas, f.selo, f.ano].filter(Boolean).join(" · ") })),
        h("div", { class: "capa-acoes" }, ouvirAqui,
          f.link ? h("a", { class: "botao botao--mini botao--linha", href: f.link, target: "_blank", rel: "noopener", texto: "Spotify ↗" }) : null),
        player);
      ouvirAqui.addEventListener("click", () => {
        if (e.tipo === "fora") return window.open(e.src, "_blank", "noopener");
        if (e.tipo === "tela") return abrirTela(iframe(e.src), e.largo);
        const aberta = card.classList.toggle("tocando");
        ouvirAqui.setAttribute("aria-expanded", aberta);
        ouvirAqui.textContent = aberta ? "Fechar player" : "Ouvir aqui";
        $$(".capa.tocando", listaFaixas).forEach((o) => {
          if (o === card) return;
          o.classList.remove("tocando"); $(".capa-player", o).replaceChildren();
          const b = $(".capa-acoes button", o); b.textContent = "Ouvir aqui"; b.setAttribute("aria-expanded", "false");
        });
        if (aberta) player.replaceChildren(iframe(e.src)); else player.replaceChildren();
      });
      listaFaixas.append(card);
    });
  }
  const ouvir = $("[data-ouvir-tudo]");
  if (ouvir && S.ouvirTudo && S.ouvirTudo.url) { ouvir.href = S.ouvirTudo.url; ouvir.textContent = `${S.ouvirTudo.rotulo || "Ouvir"} ↗`; ouvir.hidden = false; }

  /* ── 04 Ao vivo: abas, prévias mudas e player com som ─────────────────── */
  const trilho = $("[data-lista=videos]");
  if (trilho && !vazio(S.videos)) {
    const grupos = [...new Set(S.videos.map((v) => v.grupo).filter(Boolean))];
    for (const v of S.videos) {
      const quadroV = h("span", { class: "video-quadro" });
      if (v.poster) quadroV.append(h("img", { src: v.poster, alt: "", loading: "lazy" }));
      if (v.previa && !reduzir) {
        const pv = h("video", { muted: true, loop: true, playsinline: true, preload: "none", poster: v.poster || null, "aria-hidden": "true" });
        pv.muted = true;
        pv.src = v.previa;
        quadroV.append(pv);
      }
      const bola = h("span", { class: "video-play" }); bola.innerHTML = icone.play;
      quadroV.append(bola);
      const btn = h("button", { class: "video", type: "button", "data-grupo": v.grupo || "", "aria-label": `Assistir ${v.titulo} com som` },
        quadroV, h("span", { class: "video-legenda" }, h("span", { texto: v.titulo }), h("span", { texto: v.duracao || "" })));
      btn.addEventListener("click", () => {
        if (v.src) {
          const vid = h("video", { src: v.src, controls: true, autoplay: true, playsinline: true, poster: v.poster || null });
          return abrirTela(vid, false);
        }
        const e = embed(v.url || "");
        if (e.tipo === "tela") return abrirTela(iframe(e.src), e.largo);
        if (e.src) window.open(e.src, "_blank", "noopener");
      });
      trilho.append(btn);
    }
    // Prévias: tocam quando o cartão está na tela (celular) ou no hover (desktop)
    const previas = $$(".video-quadro video", trilho);
    if (celular) {
      const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.7 });
      previas.forEach((p) => io.observe(p));
    } else {
      previas.forEach((p) => {
        const card = p.closest(".video");
        card.addEventListener("mouseenter", () => p.play().catch(() => {}));
        card.addEventListener("mouseleave", () => p.pause());
      });
    }
    const abas = $("[data-abas]");
    if (abas && grupos.length > 1) {
      const filtrar = (g) => {
        $$(".aba", abas).forEach((a) => a.setAttribute("aria-selected", a.dataset.g === g));
        $$(".video", trilho).forEach((v) => (v.hidden = g !== "*" && v.dataset.grupo !== g));
        trilho.scrollTo({ left: 0, behavior: "smooth" });
      };
      for (const g of ["*", ...grupos]) abas.append(h("button", { class: "aba", type: "button", role: "tab", "data-g": g, texto: g === "*" ? "Todos" : g, onclick: () => filtrar(g) }));
      filtrar("*");
    }
  }

  /* ── 05 Palcos ────────────────────────────────────────────────────────── */
  const letreiro = $("[data-lista=dividiuLine]");
  if (letreiro && !vazio(P.dividiuLine)) {
    const faixa = h("div", { class: "letreiro-faixa" });
    faixa.style.setProperty("--duracao", `${Math.max(24, P.dividiuLine.length * 5)}s`);
    for (const rodada of [0, 1]) for (const nome of P.dividiuLine) faixa.append(h("span", { class: rodada ? "dup" : null, "aria-hidden": rodada ? "true" : null, texto: nome }));
    letreiro.before(h("span", { class: "letreiro-titulo", texto: "Dividiu line com" }));
    letreiro.append(faixa);
  }
  const letreiroFestas = $("[data-lista=festas]");
  if (letreiroFestas && !vazio(P.festas)) {
    const faixa = h("div", { class: "letreiro-faixa" });
    faixa.style.setProperty("--duracao", `${Math.max(28, P.festas.length * 7)}s`);
    for (const rodada of [0, 1, 2, 3]) for (const nome of P.festas) faixa.append(h("span", { class: rodada ? "dup" : null, "aria-hidden": rodada ? "true" : null, texto: nome }));
    letreiroFestas.append(faixa);
  }
  const ul = (sel, itens, fn) => { const el = $(sel); if (el && !vazio(itens)) itens.forEach((i) => el.append(fn(i))); };
  ul("[data-lista=festasGrade]", P.festas, (nome) => h("li", { class: "festa revelar" }, h("span", { class: "festa-nome", texto: nome })));
  ul("[data-lista=residencias]", P.residencias, (r) => h("li", {}, h("span", { texto: r.casa }), h("small", { texto: r.cidade || "" })));
  ul("[data-lista=eventos]", P.eventos, (e) => h("li", {}, h("span", { texto: e.nome }), h("small", { texto: [e.papel, e.cidade, e.ano].filter(Boolean).join(" · ") })));

  /* ── 06 Rider ─────────────────────────────────────────────────────────── */
  ul("[data-lista=rider]", S.rider, (r) => h("div", {}, h("dt", { texto: r.item }), h("dd", { texto: r.valor })));

  /* ── Redes: bloco próprio (cartões com ícone) + ícones no rodapé ─────── */
  const nomesRede = { instagram: "Instagram", spotify: "Spotify", soundcloud: "SoundCloud", youtube: "YouTube", beatport: "Beatport", tiktok: "TikTok", site: "Site" };
  const icones = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 9.3c3.4-1 7.2-.7 10.2.9M7.6 12.4c2.9-.8 6-.5 8.5.8M8.3 15.3c2.3-.6 4.6-.4 6.6.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    soundcloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 17.5V8.6a5 5 0 0 1 9.4 2.4 3.3 3.3 0 0 1 .3 6.5H9.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 15.5v-2M5.2 17v-5.5M7.3 17.5V9.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.2 9.2v5.6l4.8-2.8z" fill="currentColor"/></svg>',
  };
  ul("[data-lista=redes]", S.redes, (r) => {
    const a = h("a", { class: "rede", href: r.url, target: "_blank", rel: "noopener" },
      h("span", { class: "rede-icone" }), h("span", { class: "rede-nome", texto: nomesRede[r.rede] || r.rede }),
      h("span", { class: "rede-perfil", texto: r.rotulo || "" }), h("span", { class: "rede-seta", "aria-hidden": "true", texto: "↗" }));
    $(".rede-icone", a).innerHTML = icones[r.rede] || "";
    return h("li", { class: "revelar" }, a);
  });
  ul("[data-lista=redesRodape]", S.redes, (r) => {
    const a = h("a", { href: r.url, target: "_blank", rel: "noopener", "aria-label": nomesRede[r.rede] || r.rede, title: nomesRede[r.rede] || r.rede });
    a.innerHTML = icones[r.rede] || (nomesRede[r.rede] || r.rede);
    return h("li", {}, a);
  });

  /* ── Parallax leve nas artes ──────────────────────────────────────────── */
  const artes = reduzir ? [] : $$(".arte");
  if (artes.length) {
    const mover = () => {
      for (const a of artes) {
        const r = a.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.transform = `translate3d(0, ${(c * -60).toFixed(1)}px, 0) scale(1.08)`;
      }
    };
    addEventListener("scroll", () => requestAnimationFrame(mover), { passive: true });
    mover();
  }

  /* ── Topo, menu ativo, revelar e ano ──────────────────────────────────── */
  const topo = $(".topo");
  const whats = $(".whats");
  let formNaTela = false;
  const aoRolar = () => {
    const fimAbertura = cine ? cine.offsetTop + cine.offsetHeight - innerHeight * 0.35 : 40;
    const passou = scrollY > fimAbertura;
    topo && topo.classList.toggle("rolou", passou);
    topo && topo.classList.toggle("escondido", !passou);
    whats && whats.classList.toggle("visivel", passou && !formNaTela);
  };
  const formEl = $(".form");
  if (formEl) new IntersectionObserver(([e]) => { formNaTela = e.isIntersecting; aoRolar(); }).observe(formEl);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const links = $$(".menu a[href^='#']");
  const ioMenu = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("atual", a.getAttribute("href") === `#${e.target.id}`));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main > section[id]").forEach((s) => ioMenu.observe(s));

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  $$(".revelar").forEach((el) => io.observe(el));
  $$("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── Copiar e-mail e release ──────────────────────────────────────────── */
  $$("[data-copiar]").forEach((b) => b.addEventListener("click", () => copiar(b.dataset.copiar, "E-mail copiado")));
  const btnRelease = $("[data-copiar-release]");
  if (btnRelease) btnRelease.addEventListener("click", () => copiar($$(".release p").map((p) => p.textContent.trim()).join("\n\n"), "Release copiado"));

  /* ── Downloads: PDF próprio ou imprime a LP como mídia kit ────────────── */
  const D = S.downloads || {};
  const btnPdf = $("[data-pdf]");
  if (btnPdf) btnPdf.addEventListener("click", () => {
    if (D.pdf) return window.open(D.pdf, "_blank", "noopener");
    $$("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
    $$(".revelar").forEach((el) => el.classList.add("visto"));
    setTimeout(() => window.print(), 400);
  });
  const btnFotos = $("[data-fotos]");
  if (btnFotos && D.fotos) { btnFotos.href = D.fotos; btnFotos.hidden = false; }
  addEventListener("beforeprint", () => $$(".revelar").forEach((el) => el.classList.add("visto")));

  /* ── WhatsApp ─────────────────────────────────────────────────────────── */
  const num = String((S.whatsapp && S.whatsapp.numero) || "").replace(/\D/g, "");
  const linkWhats = (txt) => `https://wa.me/${num}?text=${encodeURIComponent(txt || "")}`;
  if (num) {
    if (whats) whats.href = linkWhats(S.whatsapp.mensagem);
    $$("[data-whats-link]").forEach((a) => (a.href = linkWhats(S.whatsapp.mensagem)));
  }

  /* ── Formulário de booking → e-mail ou WhatsApp ───────────────────────── */
  const form = $(".form");
  if (form) {
    const status = $(".form-status", form);
    const botao = $("button[type=submit]", form);
    const avisar = (txt, tipo) => { status.textContent = txt; status.className = `form-status campo--inteiro ${tipo || ""}`; };
    const validar = () => {
      let ok = true;
      $$("[required]", form).forEach((c) => {
        const bom = c.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value) : c.value.trim().length > 1;
        c.closest(".campo").classList.toggle("erro", !bom);
        if (!bom) ok = false;
      });
      if (!ok) avisar("Confira os campos destacados.", "falha");
      return ok;
    };
    const dataBR = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
    const dados = () => { const d = Object.fromEntries(new FormData(form)); delete d._honey; d.data = dataBR(d.data); return d; };

    $("[data-enviar-whats]", form)?.addEventListener("click", () => {
      if (!validar() || !num) return;
      const d = dados();
      const txt = [`Olá! Quero consultar uma data com ${S.nome}.`, "", `Data: ${d.data}`, `Cidade: ${d.cidade}`, d.casa && `Casa/produtora: ${d.casa}`,
        `Horário: ${d.horario}`, d.mensagem && `Sobre o evento: ${d.mensagem}`, "", `${d.nome} · ${d.email} · ${d.telefone}`]
        .filter((l) => typeof l === "string").join("\n");
      window.open(linkWhats(txt), "_blank", "noopener");
      avisar("Abrimos o WhatsApp com seu pedido pronto.", "ok");
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (form.elements._honey.value) return;
      if (!validar() || !S.contato) return;
      const d = dados();
      const assunto = `${S.contato.assunto || "Pedido de booking"} · ${d.data} · ${d.cidade}`;
      let url, corpo;
      if (S.contato.web3formsChave) {
        url = "https://api.web3forms.com/submit";
        corpo = { access_key: S.contato.web3formsChave, subject: assunto, from_name: d.nome, ...d };
      } else {
        url = `https://formsubmit.co/ajax/${encodeURIComponent(S.contato.email)}`;
        corpo = { _subject: assunto, _template: "table", _captcha: "false", _replyto: d.email, ...d };
      }
      botao.disabled = true;
      avisar("Enviando…");
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(corpo) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || r.status);
        form.reset();
        avisar("Pedido recebido. A equipe de booking responde em breve.", "ok");
      } catch (e) {
        console.warn("Falha no envio do formulário:", e);
        avisar("Não foi possível enviar agora. Use o botão do WhatsApp.", "falha");
      } finally {
        botao.disabled = false;
      }
    });
  }
})();
