import { qs, qsa, esc } from './utils.js';

let currentLanguage = "it";

export function getCurrentLanguage() {
  return currentLanguage;
}

export function toggleLanguage() {
  currentLanguage = currentLanguage === "en" ? "it" : "en";
  updateLanguage();
}

export function updateLanguage() {
  // button label
  const langToggle = qs("#lang-toggle");
  if (langToggle) langToggle.textContent = currentLanguage === "en" ? "EN / IT" : "IT / EN";

  // HERO
  const heroTagline = qs("#hero-tagline");
  const heroNote = qs("#hero-note");
  if (heroTagline) {
    heroTagline.textContent =
      currentLanguage === "en"
        ? "Learning in public. Breaking things. Taking notes."
        : "Imparare in pubblico. Rompere le cose. Prendere appunti.";
  }
  if (heroNote) {
    heroNote.textContent =
      currentLanguage === "en"
        ? "// This site is itself a project in progress"
        : "// Questo sito è esso stesso un progetto in corso";
  }

  // PACT
  const pactTitle = qs("#pact-title");
  const pactContent = qs("#pact-content");

  if (pactTitle) pactTitle.textContent = currentLanguage === "en" ? "The Nerd's Pact" : "Il Patto del Nerd";
  if (pactContent) {
    pactContent.innerHTML =
      currentLanguage === "en"
        ? `
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">01.</span><span>I'm not an expert. I'm learning, publicly and messily.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">02.</span><span>I document failures as much as successes. Often more.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">03.</span><span>AI is my assistant, not my ghost writer. The curiosity is mine.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">04.</span><span>When I don't know something, I say so. Confusion is part of the log.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">05.</span><span>The magic isn't the result. It's the path to get there.</span></li>
        `
        : `
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">01.</span><span>Non sono un esperto. Sto imparando, pubblicamente e in modo disordinato.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">02.</span><span>Documento i fallimenti tanto quanto i successi. Spesso di più.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">03.</span><span>L'AI è il mio assistente, non il mio ghost writer. La curiosità è mia.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">04.</span><span>Quando non so qualcosa, lo dico. La confusione fa parte del log.</span></li>
          <li class="flex items-start gap-3"><span class="text-[#4ade80] font-mono-tech">05.</span><span>La magia non è il risultato. È il percorso per arrivarci.</span></li>
        `;
  }

  // LAB
  const labTitle = qs("#lab-title");
  const labDescription = qs("#lab-description");
  const labSubtitle = qs("#lab-subtitle");
  const labEmptyText = qs("#lab-empty-text");

  if (labTitle) labTitle.innerHTML = '<span class="text-[#4ade80]">&gt;</span> Lab';
  if (labDescription) {
    labDescription.textContent =
      currentLanguage === "en"
        ? "Active experiments, ongoing projects, and things I'm currently breaking. Each project is a living document."
        : "Esperimenti attivi, progetti in corso e cose che sto attualmente rompendo. Ogni progetto è un documento vivo.";
  }
  if (labSubtitle) labSubtitle.textContent = currentLanguage === "en" ? "All Projects" : "Tutti i Progetti";
  if (labEmptyText) labEmptyText.textContent = currentLanguage === "en" ? "No lab projects yet" : "Nessun progetto nel lab ancora";

  // INCUBATOR
  const incubatorTitle = qs("#incubator-title");
  const incubatorDescription = qs("#incubator-description");
  if (incubatorTitle) {
    incubatorTitle.innerHTML =
      currentLanguage === "en"
        ? '<span class="text-[#fbbf24]">&gt;</span> Incubator'
        : '<span class="text-[#fbbf24]">&gt;</span> Incubatore';
  }
  if (incubatorDescription) {
    incubatorDescription.textContent =
      currentLanguage === "en"
        ? "Ideas that haven't become projects yet. Mental experiments, future possibilities, things I'm curious about."
        : "Idee che non sono ancora diventate progetti. Esperimenti mentali, possibilità future, cose che mi incuriosiscono.";
  }

  // TOOLBOX
  const toolboxTitle = qs("#toolbox-title");
  const toolboxDescription = qs("#toolbox-description");
  if (toolboxTitle) toolboxTitle.innerHTML = '<span class="text-[#8b5cf6]">&gt;</span> Toolbox';
  if (toolboxDescription) {
    toolboxDescription.textContent =
      currentLanguage === "en"
        ? "Tools I actually use in my projects. Not reviews or recommendations—just context about what worked (or didn't) for me."
        : "Strumenti che uso effettivamente nei miei progetti. Non recensioni o raccomandazioni—solo contesto su cosa ha funzionato (o no) per me.";
  }

  // WHO (versione lunga sia IT che EN)
  const whoTitle = qs("#who-title");
  const whoSubtitle = qs("#who-subtitle");
  const whoTagline = qs("#who-tagline");
  const whoBio = qs("#who-bio");
  const contactTitle = qs("#contact-title");

  if (whoTitle) {
    whoTitle.innerHTML =
      currentLanguage === "en"
        ? '<span class="text-[#e8e8e8]">&gt;</span> Who is The Nerd?'
        : '<span class="text-[#e8e8e8]">&gt;</span> Chi è The Nerd?';
  }
  if (whoSubtitle) whoSubtitle.textContent = "The Nerd";
  if (whoTagline) {
    whoTagline.textContent =
      currentLanguage === "en" ? "Curious human, professional learner" : "Umano curioso, apprendista professionista";
  }
  if (contactTitle) contactTitle.textContent = currentLanguage === "en" ? "Get in Touch" : "Contatti";

  if (whoBio) {
    whoBio.innerHTML =
      currentLanguage === "en"
        ? `
          <p>I'm not a developer by profession. I'm not an expert in anything you'll find on this site. I'm just someone who gets curious about things and then can't stop until I've figured them out (or failed spectacularly trying).</p>
          <p>This site is my public notebook. A place where I document the <em>process</em> of learning, not just the results. Because I've realized that the interesting part is never the finished product—it's all the confusion, mistakes, and "aha" moments along the way.</p>
          <p>I work with AI as my assistant. Think of it like Watson to Sherlock, or Robin to Batman. The curiosity and direction are mine; the AI helps me translate messy ideas into working experiments. I believe this is the most honest way to work with these tools: acknowledge them, credit them, but don't let them replace the human spark.</p>
          <p class="text-[#fbbf24]">If you're here expecting polished tutorials or expert knowledge, you'll be disappointed. If you're here to watch someone learn in real-time, make mistakes, and occasionally figure things out—welcome home.</p>
        `
        : `
          <p>Non sono uno sviluppatore di professione. Non sono un esperto in nulla di ciò che troverai su questo sito. Sono solo una persona che si incuriosisce e poi non riesce a fermarsi finché non capisce (o fallisce spettacolarmente nel tentativo).</p>
          <p>Questo sito è il mio quaderno pubblico. Un posto dove documento il <em>processo</em> di apprendimento, non solo i risultati. Perché ho capito che la parte interessante non è mai il prodotto finito—sono la confusione, gli errori e i momenti "aha" lungo il percorso.</p>
          <p>Lavoro con l'AI come assistente. Pensala come Watson per Sherlock, o Robin per Batman. La curiosità e la direzione sono mie; l'AI mi aiuta a tradurre idee disordinate in esperimenti funzionanti. Credo sia il modo più onesto di usare questi strumenti: riconoscerli, citarli, ma senza spegnere la scintilla umana.</p>
          <p class="text-[#fbbf24]">Se sei qui aspettandoti tutorial rifiniti o certezze da esperto, rimarrai deluso. Se sei qui per vedere qualcuno imparare in tempo reale, sbagliare e ogni tanto capirci qualcosa—benvenuto a casa.</p>
        `;
  }
}

export function initLanguageToggle() {
  qs("#lang-toggle")?.addEventListener("click", toggleLanguage);
}
