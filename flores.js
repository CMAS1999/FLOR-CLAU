
document.addEventListener('DOMContentLoaded',()=>{
  const start=document.getElementById('startBtn');
  const garden=document.getElementById('gardenExperience');
  const open=document.getElementById('openLetter');
  const close=document.getElementById('closeLetter');
  const letter=document.getElementById('letterModal');
  const sound=document.getElementById('gardenSound');
  if(start){start.addEventListener('click',()=>{setTimeout(()=>document.body.classList.add('garden-visible'),1800);});}
  function setLetter(value){letter.classList.toggle('open',value);letter.setAttribute('aria-hidden',String(!value));if(value)close.focus();}
  open?.addEventListener('click',()=>setLetter(true));
  close?.addEventListener('click',()=>setLetter(false));
  letter?.addEventListener('click',e=>{if(e.target===letter)setLetter(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setLetter(false)});
  sound?.addEventListener('click',()=>{const music=document.getElementById('bgMusic');if(!music){sound.textContent='♫ Música opcional';return;}music.muted=!music.muted;sound.textContent=music.muted?'♫ Activar música':'♫ Silenciar música';});
});
