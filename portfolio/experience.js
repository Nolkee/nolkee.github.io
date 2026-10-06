(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const board = document.querySelector('.album-board');
  const cards = [...document.querySelectorAll('.album-card')];
  const dialog = document.querySelector('.album-dialog');
  const cover = dialog.querySelector('.dialog-cover');
  const title = dialog.querySelector('#album-dialog-title');
  const artist = dialog.querySelector('.dialog-artist');
  const audio = dialog.querySelector('.player-audio');
  const playbackError = dialog.querySelector('.player-error');
  const status = dialog.querySelector('.playback-status');
  const playbackState = dialog.querySelector('.playback-state');
  const toggle = dialog.querySelector('.player-toggle');
  const seek = dialog.querySelector('.player-seek');
  const elapsed = dialog.querySelector('.elapsed');
  const duration = dialog.querySelector('.duration');
  const volume = dialog.querySelector('.volume-slider');
  const mute = dialog.querySelector('.player-mute');
  let lastVolume = 100, scrubbing = false;
  const stateLabels = {
    loading: ['正在加载', 'Loading'], playing: ['正在播放', 'Playing'],
    paused: ['已暂停', 'Paused'], ended: ['播放结束', 'Finished'],
    error: ['播放失败', 'Unavailable'], idle: ['准备播放', 'Ready to play']
  };
  let soundContext = null, soundGain = null, volumeGain = null;
  function syncToggle() {
    const playing = !audio.paused && !audio.ended;
    toggle.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', playing ? '暂停 / Pause' : '播放 / Play');
  }
  function formatTime(value) {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateTimeline() {
    const length = Number.isFinite(audio.duration) ? audio.duration : 0;
    seek.disabled = !length;
    seek.max = length;
    if (!scrubbing && !audio.seeking) seek.value = audio.currentTime || 0;
    seek.style.setProperty('--fill', `${length ? Number(seek.value) / length * 100 : 0}%`);
    elapsed.textContent = formatTime(scrubbing || audio.seeking ? Number(seek.value) : audio.currentTime);
    duration.textContent = formatTime(length);
  }
  function updateVolume() {
    const value = Number(volume.value) / 100;
    audio.muted = value === 0;
    if (volumeGain) volumeGain.gain.value = value;
    else audio.volume = value;
    mute.setAttribute('aria-pressed', String(!value));
    mute.setAttribute('aria-label', !value ? '取消静音 / Unmute' : '静音 / Mute');
    volume.style.setProperty('--fill', `${value * 100}%`);
    dialog.querySelector('.volume-value').textContent = `${Math.round(value * 100)}%`;
  }
  toggle.addEventListener('click', () => {
    if (!audio.paused) {audio.pause();return;}
    prepareSound();
    audio.play().catch(() => {if (dialog.open) {playbackError.hidden = false;setPlaybackState('error');}});
  });
  seek.addEventListener('pointerdown', () => {scrubbing = true;});
  seek.addEventListener('input', () => {
    // Preview while dragging; commit once on release (or a keyboard change).
    scrubbing = true;
    updateTimeline();
  });
  function commitSeek() {
    if (!scrubbing) return;
    const target = Number(seek.value);
    scrubbing = false;
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = Math.max(0, Math.min(target, audio.duration));
    }
    updateTimeline();
  }
  seek.addEventListener('change', commitSeek);
  seek.addEventListener('pointerup', commitSeek);
  seek.addEventListener('pointercancel', () => {scrubbing = false;updateTimeline();});
  volume.addEventListener('input', () => {
    if (Number(volume.value)) lastVolume = Number(volume.value);
    updateVolume();
  });
  mute.addEventListener('click', () => {
    if (Number(volume.value)) {lastVolume = Number(volume.value);volume.value = 0;}
    else volume.value = lastVolume;
    updateVolume();
  });
  ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied', 'seeked'].forEach(event => audio.addEventListener(event, updateTimeline));
  ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, syncToggle));
  updateVolume();syncToggle();
  function setPlaybackState(state) {
    const [zh, en] = stateLabels[state];
    status.dataset.zh = zh; status.dataset.en = en;
    status.textContent = document.documentElement.lang === 'en' ? en : zh;
    playbackState.dataset.state = state;
    cards.forEach((card, index) => {
      card.classList.toggle('is-playing', dialog.open && index === selected && state === 'playing');
    });
  }
  // Connect during the click gesture so Safari can unlock audio too. Keep the
  // volume independent of the short fade at each song's start.
  function prepareSound() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!soundContext) {
        soundContext = new Context();
        soundGain = soundContext.createGain();
        soundContext.createMediaElementSource(audio).connect(soundGain);
        volumeGain = soundContext.createGain();
        soundGain.connect(volumeGain);volumeGain.connect(soundContext.destination);
        audio.volume = 1;updateVolume();
      }
      soundContext.resume().then(() => {
        if (dialog.open && !audio.paused) softenStart();
      }).catch(() => {});
      soundGain.gain.cancelScheduledValues(soundContext.currentTime);
      soundGain.gain.setValueAtTime(0, soundContext.currentTime);
    } catch { /* Browsers without Web Audio retain native playback. */ }
  }
  function softenStart() {
    if (!soundGain || soundContext.state !== 'running') return;
    const now = soundContext.currentTime;
    soundGain.gain.cancelScheduledValues(now);
    soundGain.gain.setValueAtTime(0, now);
    soundGain.gain.linearRampToValueAtTime(1, now + .22);
  }
  let playbackRequest = 0;
  let selected = 0, trigger = null, drag = null;
  function renderAlbum(index, autoplay = false) {
    const request = ++playbackRequest;
    scrubbing = false;
    audio.pause();
    playbackError.hidden = true;
    prepareSound();
    selected = (index + cards.length) % cards.length;
    const card = cards[selected];
    cover.src = card.querySelector('img').src;
    cover.alt = card.querySelector('img').alt;
    dialog.querySelector('[data-platform=apple]').href = card.dataset.source;
    dialog.querySelector('[data-platform=netease]').href = card.dataset.netease;
    dialog.querySelector('[data-platform=spotify]').href = card.dataset.spotify;
    title.textContent = card.querySelector('strong').textContent;
    artist.textContent = card.querySelector('.album-caption > span').textContent;
    dialog.querySelector('.player-track').textContent = card.dataset.track;
    audio.src = card.dataset.audio;
    audio.playbackRate = 1;updateTimeline();
    setPlaybackState('loading');
    dialog.scrollTop = 0;
    dialog.querySelector('.album-position').textContent = `${selected + 1} / ${cards.length}`;
    if (autoplay) audio.play().catch(error => {
      if (request === playbackRequest && error.name !== 'AbortError' && dialog.open) {
        playbackError.hidden = false;
        setPlaybackState('error');
      }
    });
  }
  function showAlbum(index) {
    renderAlbum(index, true);
    trigger = cards[index];
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.querySelector('.dialog-close').focus();
  }
  function stopPlayback() {
    ++playbackRequest;
    audio.pause();
    setPlaybackState('idle');
    document.body.classList.remove('dialog-open');
  }
  function closeAlbum() {
    // Native close events are queued; silence audio during the user's gesture.
    stopPlayback();
    dialog.close();
  }
  dialog.querySelector('.dialog-close').addEventListener('click', closeAlbum);
  dialog.addEventListener('cancel', event => {event.preventDefault();closeAlbum();});
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    stopPlayback();
    trigger?.focus({preventScroll: true});
  });
  dialog.addEventListener('click', event => {if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeAlbum();
  }});
  audio.addEventListener('error', () => {if (dialog.open) {playbackError.hidden = false;setPlaybackState('error');}});
  audio.addEventListener('playing', () => {
    // A pending play must never restart audio after the dialog has closed.
    if (!dialog.open) {audio.pause();return;}
    playbackError.hidden = true;softenStart();setPlaybackState('playing');
  });
  audio.addEventListener('pause', () => {
    if (dialog.open && !audio.ended && audio.paused && audio.readyState >= 2) setPlaybackState('paused');
  });
  audio.addEventListener('waiting', () => {if (dialog.open && !audio.paused) setPlaybackState('loading');});
  audio.addEventListener('ended', () => {if (dialog.open) setPlaybackState('ended');});
  dialog.querySelectorAll('.platform-links a').forEach(link => link.addEventListener('click', () => audio.pause()));
  dialog.querySelectorAll('[data-album-step]').forEach(button => button.addEventListener('click', () => renderAlbum(selected + Number(button.dataset.albumStep), true)));
  dialog.addEventListener('keydown', event => {
    if (event.target.closest('.music-controls')) return;
    if (event.target === audio) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();renderAlbum(selected + (event.key === 'ArrowLeft' ? -1 : 1), true);
    }
  });
  cards.forEach((card,index) => {
    let suppressClick = false;
    card.addEventListener('click',event => {if (suppressClick) {event.preventDefault();suppressClick=false;return;}showAlbum(index);});
    card.addEventListener('pointerdown', event => {
      if (mobile.matches || event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = {card,x:event.clientX,y:event.clientY,dx:Number(card.dataset.dx || 0),dy:Number(card.dataset.dy || 0),moved:false,id:event.pointerId};

    });
    card.addEventListener('pointermove',event => {
      if (!drag || drag.card !== card) return;
      const x = event.clientX-drag.x,y=event.clientY-drag.y;
      if (!drag.moved && Math.hypot(x,y)<5) return;
      drag.moved=true;card.setPointerCapture(event.pointerId);card.classList.add('is-dragging');
      const dx=Math.max(-card.offsetLeft+30,Math.min(board.clientWidth-card.offsetLeft-card.offsetWidth-30,drag.dx+x));
      const dy=Math.max(-card.offsetTop+30,Math.min(board.clientHeight-card.offsetTop-card.offsetHeight-30,drag.dy+y));
      card.style.setProperty('--dx',`${dx}px`);card.style.setProperty('--dy',`${dy}px`);card.dataset.dx=dx;card.dataset.dy=dy;
    });
    function endDrag(event) {
      if (!drag || drag.card!==card) return;
      suppressClick=drag.moved;card.classList.remove('is-dragging');
      if (card.hasPointerCapture(event.pointerId))card.releasePointerCapture(event.pointerId);
      drag=null;
      // A cancelled pointer does not produce a click to clear this flag.
      if (event.type==='pointercancel')suppressClick=false;
    }
    card.addEventListener('pointerup',endDrag);card.addEventListener('pointercancel',endDrag);
    card.querySelector('img').addEventListener('dragstart',event=>event.preventDefault());
  });
  function resetCards(){cards.forEach(card=>{card.style.removeProperty('--dx');card.style.removeProperty('--dy');delete card.dataset.dx;delete card.dataset.dy;});}
  document.querySelector('.album-reset').addEventListener('click',resetCards);
  mobile.addEventListener('change',resetCards);
  // A quiet digital object: pointer response on mouse devices, two layouts for
  // everyone. Reduced-motion users retain the control without interpolation.
  const signal = document.querySelector('.signal-art');
  const signalButton = document.querySelector('.signal-switch');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  function switchGraphic() {
    const grid = signal.dataset.layout !== 'grid';
    signal.dataset.layout = grid ? 'grid' : 'orbit';
    signalButton.setAttribute('aria-pressed', String(grid));
    signal.setAttribute('aria-pressed', String(grid));
  }
  signalButton.addEventListener('click', switchGraphic);
  signal.addEventListener('click', switchGraphic);
  function resetSignal() {
    signal.style.removeProperty('--pointer-x');
    signal.style.removeProperty('--pointer-y');
  }
  signal.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
    const rect = signal.getBoundingClientRect();
    signal.style.setProperty('--pointer-x', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 22}deg`);
    signal.style.setProperty('--pointer-y', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 18}deg`);
  });
  signal.addEventListener('pointerleave', resetSignal);
  reduced.addEventListener('change', resetSignal);

  const progress = document.querySelector('.reading-progress');
  const sections = [...document.querySelectorAll('#projects,#about,#life,#contact')];
  const navLinks = [...document.querySelectorAll('header nav a[href^="#"]')];
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.max(0, Math.min(1, scrollY / total)) : 0})`;
    const active = sections.filter(section => section.getBoundingClientRect().top <= innerHeight * .35).at(-1);
    navLinks.forEach(link => {
      if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function requestScroll() {if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);}
  addEventListener('scroll', requestScroll, {passive: true});
  addEventListener('resize', requestScroll);
  const geometry = new ResizeObserver(requestScroll);
  geometry.observe(document.querySelector('main'));
  requestScroll();

  // Reveal once, with no fading while reading or scrolling back up. Hash targets
  // and keyboard focus are always immediately visible.
  if ('IntersectionObserver' in window && !reduced.matches) {
    const nodes = [...document.querySelectorAll('.section-label,.project,.about-grid,.contact-grid')];
    const reveal = node => {
      node.classList.add('reveal-visible');
      node.classList.remove('reveal-pending');
      observer.unobserve(node);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {if (entry.isIntersecting) reveal(entry.target);});
    }, {rootMargin: '0px 0px -24px 0px', threshold: 0});
    nodes.forEach(node => {
      if (node.getBoundingClientRect().top < innerHeight) return;
      node.classList.add('reveal-pending', 'reveal-ready');
      observer.observe(node);
      node.addEventListener('focusin', () => reveal(node));
    });
    function revealHash() {
      const target = document.getElementById(location.hash.slice(1));
      if (target) nodes.filter(node => target.contains(node) || node.contains(target)).forEach(reveal);
    }
    addEventListener('hashchange', revealHash);
    revealHash();
    reduced.addEventListener('change', () => {if (reduced.matches) nodes.forEach(reveal);});
  }
})();
