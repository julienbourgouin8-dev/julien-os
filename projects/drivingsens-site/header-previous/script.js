(function(){
  var filter=new URLSearchParams(window.location.search).get('filter')||'light';
  if(['original','light','bright','soft'].indexOf(filter)===-1){filter='light'}
  document.body.classList.add('tone-'+filter);
  var type=new URLSearchParams(window.location.search).get('type')||'urban';
  if(['urban','manrope','bodoni','space','outfit'].indexOf(type)===-1){type='urban'}
  document.body.classList.add('type-'+type);
  var proof=new URLSearchParams(window.location.search).get('proof')||'slim';
  if(['slim','capsule','glass','glow','signature'].indexOf(proof)===-1){proof='slim'}
  document.body.classList.add('proof-'+proof);
  var topWord=document.querySelector('.story-word--top');
  var bottomWord=document.querySelector('.story-word--bottom');
  var storyTitle=document.querySelector('.story-title');
  var intro=document.querySelector('.intro');
  var film=document.querySelector('.film');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stories=[
    ['Vivez l’ automobile','autrement',false],
    ['Tout commence','au volant',false],
    ['Chaque mouvement','gagne en précision',false],
    ['Peu à peu, la technique','devient instinct',false],
    ['La maîtrise laisse place','à l’émotion',false],
    ['C’est là que commence','Driving Sens',false]
  ];
  var storyIndex=0;
  var typeScale={
    urban:{desktopMax:90,desktopMin:48,desktopVw:.058,mobileMax:54,mobileMin:36,mobileVw:.095},
    manrope:{desktopMax:78,desktopMin:44,desktopVw:.051,mobileMax:49,mobileMin:34,mobileVw:.086},
    bodoni:{desktopMax:98,desktopMin:52,desktopVw:.064,mobileMax:58,mobileMin:38,mobileVw:.102},
    space:{desktopMax:74,desktopMin:43,desktopVw:.048,mobileMax:47,mobileMin:33,mobileVw:.082},
    outfit:{desktopMax:86,desktopMin:47,desktopVw:.056,mobileMax:52,mobileMin:35,mobileVw:.091}
  }[type];

  function fitStory(){
    var mobile=window.innerWidth<=900;
    var base=mobile?Math.min(typeScale.mobileMax,Math.max(typeScale.mobileMin,window.innerWidth*typeScale.mobileVw)):Math.min(typeScale.desktopMax,Math.max(typeScale.desktopMin,window.innerWidth*typeScale.desktopVw));
    var longest=Math.max(topWord.textContent.length,bottomWord.textContent.length);
    var gap=longest<=14?'-.15em':longest<=21?'-.09em':'-.035em';
    storyTitle.style.setProperty('--story-gap',gap);
    storyTitle.style.fontSize=base+'px';
    var available=window.innerWidth*(mobile?.9:.88);
    var widest=Math.max(topWord.scrollWidth,bottomWord.scrollWidth);
    if(widest>available){storyTitle.style.fontSize=Math.max(mobile?32:44,base*(available/widest))+'px'}
  }

  function showStory(nextIndex,animate){
    if(nextIndex===storyIndex){return}
    storyIndex=nextIndex;
    topWord.textContent=stories[storyIndex][0];
    bottomWord.textContent=stories[storyIndex][1];
    fitStory();
    topWord.classList.remove('is-refreshing');
    bottomWord.classList.remove('is-refreshing');
    if(!animate){return}
    void storyTitle.offsetWidth;
    topWord.classList.add('is-refreshing');
    bottomWord.classList.add('is-refreshing');
    window.setTimeout(function(){
      topWord.classList.remove('is-refreshing');
      bottomWord.classList.remove('is-refreshing');
    },1100);
  }

  function animateCounter(){
    var counter=document.querySelector('.counter');
    if(!counter){return}
    var target=parseInt(counter.getAttribute('data-count'),10)||420;
    if(reduced){counter.textContent=target;return}
    var startedAt=null;
    var duration=1800;
    function tick(now){
      if(startedAt===null){startedAt=now}
      var progress=Math.min(1,(now-startedAt)/duration);
      var eased=1-Math.pow(1-progress,4);
      counter.textContent=String(Math.round(target*eased)).padStart(3,'0');
      if(progress<1){requestAnimationFrame(tick)}else{counter.textContent=String(target)}
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(function(){
    document.body.classList.add('motion-ready');
    window.setTimeout(animateCounter,380);
  });
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(fitStory)}else{fitStory()}
  window.addEventListener('resize',fitStory);
  if(film){
    film.addEventListener('timeupdate',function(){
      if(!film.duration){return}
      var nextIndex=Math.min(stories.length-1,Math.floor(film.currentTime/(film.duration/stories.length)));
      showStory(nextIndex,!reduced);
    });
  }
})();
