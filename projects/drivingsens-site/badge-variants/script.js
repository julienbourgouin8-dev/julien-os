(function(){
  var proofText={
    slim:'clients / an',
    capsule:'clients accompagnés',
    glass:'accompagnés / an',
    glow:'clients par an',
    signature:'clients accompagnés chaque année'
  };
  var small=document.querySelector('.proofs__primary small');
  var buttons=[].slice.call(document.querySelectorAll('[data-proof]'));

  function apply(val){
    document.body.dataset.proof=val;
    if(small){small.textContent=proofText[val]||proofText.slim}
    buttons.forEach(function(b){b.classList.toggle('is-active',b.dataset.proof===val)});
  }

  buttons.forEach(function(b){
    b.addEventListener('click',function(){apply(b.dataset.proof)});
  });

  apply(document.body.dataset.proof||'slim');
})();
