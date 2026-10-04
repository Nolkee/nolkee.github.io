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
  let playbackRequest = 0;
  let selected = 0, trigger = null, drag = null;
  function renderAlbum(index, autoplay = false) {
    const request = ++playbackRequest;
    audio.pause();
    playbackError.hidden = true;
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
    dialog.querySelector('.album-position').textContent = `${selected + 1} / ${cards.length}`;
    if (autoplay) audio.play().catch(error => {
      if (request === playbackRequest && error.name !== 'AbortError') playbackError.hidden = false;
    });
  }
  function showAlbum(index) {
    renderAlbum(index, true);
    trigger = cards[index];
    dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.querySelector('.dialog-close').focus();
  }
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    ++playbackRequest;
    audio.pause();
    document.body.classList.remove('dialog-open');
    trigger?.focus({preventScroll: true});
  });
  dialog.addEventListener('click', event => {if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }});
  audio.addEventListener('error', () => {if (dialog.open) playbackError.hidden = false;});
  audio.addEventListener('playing', () => {playbackError.hidden = true;});
  dialog.querySelectorAll('[data-album-step]').forEach(button => button.addEventListener('click', () => renderAlbum(selected + Number(button.dataset.albumStep), true)));
  dialog.addEventListener('keydown', event => {
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
  let ticking=false;
  const progress=document.querySelector('.reading-progress');
  function updateScroll(){const height=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${height>0?scrollY/height:0})`;const sections=[...document.querySelectorAll('#about,#projects,#life')];
    const active=sections.filter(section=>section.getBoundingClientRect().top<=innerHeight*.3).at(-1);
    document.querySelectorAll('header nav a[href^="#"]').forEach(link=>{if(active && link.hash===`#${active.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    ticking=false;}
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateScroll);}},{passive:true});
  addEventListener('resize',updateScroll);updateScroll();
  if(!reduced.matches){
    const reveal=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:.35,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});reveal.unobserve(entry.target);}});},{threshold:.1});
    document.querySelectorAll('.project,.about h2,.section-label').forEach(element=>reveal.observe(element));
  }
})();
