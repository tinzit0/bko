// Shared finishing touches for the homepage and individual profiles.
export function initLuxury() {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=matchMedia('(hover:hover) and (pointer:fine)');
  const animations=new Set();
  const selector='.service-grid article, .insurance-placeholder, .insurance-card, .insurance-group .section-heading, .insurance-leadership, .profile-content section, .profile-book, .profile-distinction, .profile-timeline li, #equipo .person-copy, .profile-hero>div:last-child';
  const targets=document.querySelectorAll(selector);
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const el=entry.target;
      el.classList.add('luxury-visible');
      observer.unobserve(el);
      if(reduced.matches||!el.animate)continue;
      const sequence=el.matches('.person-copy')?[...el.children]:[el];
      sequence.forEach((item,index)=>{
        const animation=item.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:800,delay:Math.min(index,4)*75,easing:'cubic-bezier(.16,1,.3,1)'});
        animations.add(animation);animation.finished.then(()=>animations.delete(animation)).catch(()=>animations.delete(animation));
      });
    }
  },{threshold:.08}):null;
  targets.forEach(el=>observer?.observe(el));
  document.addEventListener('bko:content-updated',()=>document.querySelectorAll(selector).forEach(el=>{if(!el.classList.contains('luxury-visible'))observer?.observe(el)}));

  const buttons=[...document.querySelectorAll('.button')];
  let frame=0;
  const pending=new Map();
  const reset=el=>{pending.delete(el);el.style.removeProperty('--magnet-x');el.style.removeProperty('--magnet-y');el.classList.remove('magnet-active')};
  for(const el of buttons){
    el.addEventListener('pointermove',e=>{
      if(reduced.matches||!pointer.matches||e.pointerType==='touch')return;
      const r=el.getBoundingClientRect();pending.set(el,{x:(e.clientX-r.left-r.width/2)*.045,y:(e.clientY-r.top-r.height/2)*.10});
      if(!frame)frame=requestAnimationFrame(()=>{frame=0;for(const [button,p]of pending){button.style.setProperty('--magnet-x',`${p.x}px`);button.style.setProperty('--magnet-y',`${p.y}px`);button.classList.add('magnet-active')}pending.clear()});
    },{passive:true});
    el.addEventListener('pointerleave',()=>reset(el));el.addEventListener('pointercancel',()=>reset(el));el.addEventListener('blur',()=>reset(el));
  }
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;buttons.forEach(reset);for(const animation of animations)animation.cancel();animations.clear()}
  reduced.addEventListener('change',stop);pointer.addEventListener('change',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
  document.querySelectorAll('.profile-sections details').forEach(details=>details.addEventListener('toggle',()=>{
    if(!details.open||reduced.matches)return;
    const body=details.querySelector(':scope>div');if(!body)return;
    const animation=body.animate([{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 0'}],{duration:400,easing:'ease-out'});
    animations.add(animation);animation.finished.then(()=>animations.delete(animation)).catch(()=>animations.delete(animation));
  }));
}
