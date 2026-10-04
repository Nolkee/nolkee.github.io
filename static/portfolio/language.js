(() => {
  const buttons = [...document.querySelectorAll('[data-language]')];
  const texts = [...document.querySelectorAll('[data-zh][data-en]')];
  const title = {zh:'nolkee — 开发、研究与好奇心',en:'nolkee — Development, research & curiosity'};
  const description = {zh:'nolkee / Jiabin Yin 的个人作品集：全栈开发、AI Agent、低光图像增强研究与数据分析。',en:'The portfolio of nolkee / Jiabin Yin: full-stack development, AI agents, low-light image enhancement research and data analysis.'};
  const attributes = [
    ['nav','aria-label',{zh:'主导航',en:'Main navigation'}],
    ['.hello img','alt',{zh:'nolkee 的 GitHub 头像',en:'nolkee’s GitHub avatar'}],
    ['.pipeline','aria-label',{zh:'模型流程',en:'Model pipeline'}]
  ];
  function setLanguage(language) {
    const lang = language === 'en' ? 'en' : 'zh';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    texts.forEach(el => { el.textContent = el.dataset[lang]; });
    document.title = title[lang];
    document.querySelector('meta[name="description"]').content = description[lang];
    buttons.forEach(button => {button.setAttribute('aria-pressed',String(button.dataset.language === lang));});
    attributes.forEach(([selector,attribute,values]) => {
      const element = document.querySelector(selector);
      if (element) element.setAttribute(attribute,values[lang]);
    });
    try {localStorage.setItem('nolkee-language',lang);} catch {}
  }
  buttons.forEach(button => button.addEventListener('click',() => setLanguage(button.dataset.language)));
  let language = 'zh';
  try {language = localStorage.getItem('nolkee-language') || 'zh';} catch {}
  setLanguage(language);
})();
