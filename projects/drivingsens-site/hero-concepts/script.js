(function(){
  var body=document.body;
  var concepts=[].slice.call(document.querySelectorAll('.concept'));
  var buttons=[].slice.call(document.querySelectorAll('[data-version]'));
  var switcher=document.querySelector('.switcher');
  var toggle=document.querySelector('.switcher__toggle');
  var toggleNumber=toggle.querySelector('b');
  function show(version){
    body.dataset.concept=version;
    concepts.forEach(function(c,i){c.classList.toggle('is-active',i===version-1)});
    buttons.forEach(function(b){b.classList.toggle('is-active',Number(b.dataset.version)===version)});
    toggleNumber.textContent=String(version).padStart(2,'0');
    switcher.classList.remove('is-open');
    toggle.setAttribute('aria-expanded','false');
  }
  buttons.forEach(function(button){button.addEventListener('click',function(){show(Number(button.dataset.version))})});
  toggle.addEventListener('click',function(){var open=switcher.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open))});
  document.addEventListener('keydown',function(event){var current=Number(body.dataset.concept);if(event.key==='ArrowRight')show(current===5?1:current+1);if(event.key==='ArrowLeft')show(current===1?5:current-1)});
  show(1);
})();
