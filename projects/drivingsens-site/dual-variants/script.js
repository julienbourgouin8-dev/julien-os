(function(){
  var variants=[].slice.call(document.querySelectorAll('.variant'));
  var picks=[].slice.call(document.querySelectorAll('[data-pick]'));
  var picker=document.querySelector('.picker');
  var toggle=document.querySelector('.picker__toggle');
  var number=toggle.querySelector('b');
  var navLinks=[].slice.call(document.querySelectorAll('.nav a'));
  var reserve=document.querySelector('.reserve');
  var filterButtons=[].slice.call(document.querySelectorAll('[data-filter]'));
  var headers=[
    {nav:['Particuliers','Entreprises','Éco-conduite','Blog'],cta:'Réserve ta session'},
    {nav:['Offres particuliers','Offres entreprises','Tarifs','À propos'],cta:'Réserver'},
    {nav:['Particuliers','Entreprises','L’éco-conduite','Blog & FAQ'],cta:'Réserve ta session'},
    {nav:['Nos offres','Entreprises','À propos','Contact'],cta:'Prendre rendez-vous'},
    {nav:['Particuliers','Entreprises','Tarifs','Blog'],cta:'Réserver une session'}
  ];
  function show(value){
    document.body.dataset.version=value;
    variants.forEach(function(item,index){item.classList.toggle('is-active',index===value-1)});
    picks.forEach(function(item){item.classList.toggle('is-active',Number(item.dataset.pick)===value)});
    navLinks.forEach(function(item,index){item.textContent=headers[value-1].nav[index]});
    reserve.textContent=headers[value-1].cta;
    number.textContent=String(value).padStart(2,'0');picker.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');
  }
  picks.forEach(function(item){item.addEventListener('click',function(){show(Number(item.dataset.pick))})});
  filterButtons.forEach(function(item){item.addEventListener('click',function(){document.body.dataset.filter=item.dataset.filter;filterButtons.forEach(function(button){button.classList.toggle('is-active',button===item)})})});
  toggle.addEventListener('click',function(){var open=picker.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open))});
  document.addEventListener('keydown',function(event){var n=Number(document.body.dataset.version);if(event.key==='ArrowRight')show(n===5?1:n+1);if(event.key==='ArrowLeft')show(n===1?5:n-1)});
  show(1);
})();
