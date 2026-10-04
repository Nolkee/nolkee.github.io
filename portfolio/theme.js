(() => {
  const root = document.documentElement;
  const button = document.querySelector('.theme-toggle');
  function setTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? '切换浅色 / Switch to light' : '切换深色 / Switch to dark');
    button.title = dark ? '切换浅色 / Switch to light' : '切换深色 / Switch to dark';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#15171b' : '#fafbfc';
  }
  setTheme(root.dataset.theme === 'dark');
  button.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    setTheme(dark);
    try {localStorage.setItem('nolkee-theme', dark ? 'dark' : 'light');} catch {}
  });
})();
