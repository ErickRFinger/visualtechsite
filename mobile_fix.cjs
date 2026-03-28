const fs = require('fs');

try {
  let appCss = fs.readFileSync('src/App.css', 'utf8');

  const mobileCss = `
/* ================== FASE 15: MOBILE BRUTALISM & RESPONSIVENESS ================== */

@media (max-width: 900px) {
  /* 1. Header & Menu Brutalista Mobile */
  .header-visualtech-central {
    padding: 15px 20px !important;
    flex-wrap: wrap !important;
    justify-content: space-between !important;
  }

  /* O botão hamburger precisa aparecer e organizar a tela */
  .mobile-menu-btn {
    display: block !important;
    background: transparent !important;
    border: none !important;
    color: #ffe600 !important;
    font-size: 2rem !important;
    cursor: pointer !important;
  }

  /* Dropdown Gigante (Motorsport) */
  .menu-central {
    display: none !important;
    flex-direction: column !important;
    width: 100% !important;
    background: #080808 !important;
    position: absolute !important;
    top: 75px !important;
    left: 0 !important;
    padding: 20px 0 !important;
    border-bottom: 3px solid #ffe600 !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.9) !important;
    z-index: 9999 !important;
    order: 4 !important; /* Move para o final do header no flex-wrap */
  }

  .menu-central.mobile-open {
    display: flex !important;
  }

  .menu-central button {
    width: 100% !important;
    text-align: center !important;
    font-size: 1.2rem !important;
    padding: 15px !important;
    border-bottom: 1px solid #222 !important;
    margin: 0 !important;
  }

  /* 2. Redução de Espaços Mortos (Paddings) */
  main > section {
    padding: 100px 15px 40px !important; 
    min-height: auto !important;
    height: auto !important;
  }
  
  /* 3. Tipografia Massiva Escalonada */
  .hero-title {
    font-size: clamp(2rem, 10vw, 3.5rem) !important;
    line-height: 1.1 !important;
  }
  .hero-subtitle {
    font-size: clamp(0.9rem, 4vw, 1.1rem) !important;
  }
  .section-title {
    font-size: clamp(1.8rem, 8vw, 2.8rem) !important;
    text-align: center !important;
    margin-bottom: 25px !important;
  }

  /* 4. Grids e Elementos Lado a Lado */
  .services-grid, .valores-grid, .diferenciais-grid, .produtos-grid {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }

  /* 5. Ajustes de Imagens e Layouts do Técnico/Planos */
  .sobre-nos-content, .diferenciais-content, .tecnico-container {
    flex-direction: column !important;
  }

  .tecnico-profile {
    width: 100% !important;
    margin-bottom: 2rem !important;
  }

  .search-container {
    width: 100% !important;
    order: 3 !important; /* Joga a barra de pesquisa para debaixo */
    margin-top: 15px !important;
  }

  /* Ajuste no Logo */
  .logo-central {
    max-height: 40px !important;
  }

  /* Footer Mobile */
  .footer-visualtech-modern {
    padding: 40px 15px 20px !important;
  }
}

/* Fixes Específicos para Celulares Pequenos (iPhone SE, etc) */
@media (max-width: 480px) {
  .hero-title {
    font-size: clamp(1.8rem, 12vw, 2.2rem) !important;
  }
  .cta-group {
    flex-direction: column !important;
    width: 100% !important;
  }
  .cta-btn {
    width: 100% !important;
    text-align: center !important;
    margin-bottom: 15px !important;
  }
}
  `;

  if (!appCss.includes('FASE 15: MOBILE BRUTALISM')) {
    appCss += '\n' + mobileCss;
    fs.writeFileSync('src/App.css', appCss);
    console.log('App.css Mobile Overhaul Injected.');
  }

} catch(err) {
  console.error(err);
}
