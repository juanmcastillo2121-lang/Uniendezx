(function(){
  var DIFF = {
    easy:{time:12, max:20, mulMax:6, divMax:6},
    mid:{time:9, max:40, mulMax:10, divMax:9},
    hard:{time:7, max:80, mulMax:15, divMax:12}
  };
  var S = {diff:'easy', ops:['add','sub'], score:0, streak:0, lives:3,
           total:0, good:0, locked:true, timer:null, left:0, answer:0};

  var $ = function(id){ return document.getElementById(id); };
  var rnd = function(a,b){ return Math.floor(Math.random()*(b-a+1))+a; };

  function show(name){
    ['start','play','end'].forEach(function(n){ $('s-'+n).classList.remove('on'); });
    $('s-'+name).classList.add('on');
  }

  function bestKey(d){ return 'mathblitz.best.'+d; }
  function getBest(d){ return parseInt(localStorage.getItem(bestKey(d))||'0',10)||0; }

  function hearts(){
    var h = '';
    for(var i=0;i<3;i++){
      h += '<svg viewBox="0 0 24 24"><path class="hp'+(i>=S.lives?' off':'')+'" d="M12 21s-8-5.1-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 15.9 12 21 12 21z"/></svg>';
    }
    $('hearts').innerHTML = h;
  }

  function makeQuestion(){
    var d = DIFF[S.diff];
    var op = S.ops[rnd(0, S.ops.length-1)];
    var a,b,text,ans;

    if(S.diff==='hard' && Math.random()<0.25){
      var o2 = S.ops[rnd(0, S.ops.length-1)];
      a = rnd(2,9); b = rnd(2,9);
      var c = rnd(1,20);
      var first;
      if(o2==='add'){ first = a+b; text = a+' + '+b; }
      else if(o2==='sub'){ first = a+b; text = first+' − '+b; }
      else if(o2==='mul'){ first = a*b; text = a+' × '+b; }
      else { first = a*b; text = first+' ÷ '+b; }
      ans = first + c; text += ' + '+c;
    } else if(op==='add'){
      a = rnd(1, d.max); b = rnd(1, d.max); text = a+' + '+b; ans = a+b;
    } else if(op==='sub'){
      a = rnd(2, d.max); b = rnd(1, a-1); text = a+' − '+b; ans = a-b;
    } else if(op==='mul'){
      a = rnd(2, d.mulMax); b = rnd(2, d.mulMax); text = a+' × '+b; ans = a*b;
    } else {
      b = rnd(2, d.divMax); ans = rnd(2, d.divMax); a = b*ans; text = a+' ÷ '+b;
    }
    return {text:text, ans:ans};
  }

  function options(correct){
    var set = [correct], guard = 0;
    var deltas = [1,-1,2,-2,3,-3,4,-4,5,-5,10,-10];
    while(set.length<4 && guard++<300){
      var c = correct + deltas[rnd(0,deltas.length-1)];
      if(c<0) c = correct + rnd(1,12);
      if(set.indexOf(c)===-1) set.push(c);
    }
    while(set.length<4){ var x = correct + set.length + 7; if(set.indexOf(x)===-1) set.push(x); }
    for(var i=set.length-1;i>0;i--){ var j=rnd(0,i); var t=set[i]; set[i]=set[j]; set[j]=t; }
    return set;
  }

  function startTimer(){
    S.left = DIFF[S.diff].time;
    paintBar();
    clearInterval(S.timer);
    S.timer = setInterval(function(){
      S.left -= 0.1;
      if(S.left<=0){ S.left=0; paintBar(); clearInterval(S.timer); timeout(); return; }
      paintBar();
    },100);
  }

  function paintBar(){
    var pct = Math.max(0, (S.left/DIFF[S.diff].time)*100);
    var f = $('barfill');
    f.style.width = pct+'%';
    f.className = 'barfill' + (pct<30?' warn':'');
  }

  function next(){
    S.locked = false;
    $('fb').textContent = '';
    $('fb').className = 'fb';
    var q = makeQuestion();
    S.answer = q.ans;
    $('q').textContent = q.text;
    $('qmeta').textContent = 'Pregunta ' + (S.total+1) + ' · ' + (S.diff==='easy'?'fácil':S.diff==='mid'?'medio':'difícil');
    $('score').textContent = S.score;
    $('streak').textContent = S.streak;
    hearts();

    var opts = options(q.ans);
    var box = $('opts');
    box.innerHTML = '';
    opts.forEach(function(v,i){
      var b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = v + '<span class="k">' + (i+1) + '</span>';
      b.onclick = function(){ answer(v, b); };
      box.appendChild(b);
    });
    startTimer();
  }

  function answer(val, btn){
    if(S.locked) return;
    S.locked = true;
    clearInterval(S.timer);
    S.total++;
    var buttons = $('opts').children;
    for(var i=0;i<buttons.length;i++){
      buttons[i].classList.add('done');
      if(parseInt(buttons[i].textContent,10) === S.answer) buttons[i].classList.add('good');
    }
    if(val === S.answer){
      S.good++;
      S.streak++;
      var mult = 1 + Math.min(4, Math.floor(S.streak/3));
      S.score += (10 + Math.round(S.left*2)) * mult;
      $('fb').textContent = mult>1 ? 'Correcto · x'+mult+' por racha' : 'Correcto';
      $('fb').className = 'fb ok';
      $('score').textContent = S.score;
      $('streak').textContent = S.streak;
      setTimeout(function(){ if(S.lives>0) next(); }, 520);
    } else {
      btn.classList.add('bad');
      lose('Fallo');
    }
  }

  function timeout(){
    if(S.locked) return;
    S.locked = true;
    S.total++;
    var buttons = $('opts').children;
    for(var i=0;i<buttons.length;i++){
      if(parseInt(buttons[i].textContent,10) === S.answer) buttons[i].classList.add('good');
    }
    lose('Se acabó el tiempo');
  }

  function lose(msg){
    S.streak = 0;
    S.lives--;
    $('streak').textContent = 0;
    hearts();
    $('fb').textContent = msg + ' · era ' + S.answer;
    $('fb').className = 'fb no';
    setTimeout(function(){ if(S.lives<=0) end(); else next(); }, 850);
  }

  function end(){
    clearInterval(S.timer);
    S.locked = true;
    var b = getBest(S.diff);
    if(S.score > b){
      localStorage.setItem(bestKey(S.diff), String(S.score));
      b = S.score;
      $('endTag').textContent = '¡Nuevo récord!';
    } else {
      $('endTag').textContent = 'Partida terminada';
    }
    $('endScore').textContent = S.score;
    $('endMsg').textContent = S.score >= 400 ? 'Cálculo de élite' : S.score >= 150 ? 'Buen nivel' : 'Sigue entrenando';
    $('endAcc').textContent = (S.total ? Math.round(S.good/S.total*100) : 0) + '%';
    $('endTotal').textContent = S.total;
    $('recDiff').textContent = S.diff==='easy'?'fácil':S.diff==='mid'?'medio':'difícil';
    $('recVal').textContent = b;
    show('end');
  }

  function reset(){
    S.score = 0; S.streak = 0; S.lives = 3; S.total = 0; S.good = 0;
    $('score').textContent = '0';
    $('streak').textContent = '0';
    show('play');
    next();
  }

  document.querySelectorAll('.dif').forEach(function(el){
    el.onclick = function(){
      document.querySelectorAll('.dif').forEach(function(x){ x.classList.remove('sel'); });
      el.classList.add('sel');
      S.diff = el.dataset.d;
    };
  });

  document.querySelectorAll('.op').forEach(function(el){
    el.onclick = function(){
      var op = el.dataset.op;
      var i = S.ops.indexOf(op);
      if(i>-1){ if(S.ops.length===1) return; S.ops.splice(i,1); el.classList.remove('sel'); }
      else { S.ops.push(op); el.classList.add('sel'); }
    };
  });

  $('play').onclick = reset;
  $('again').onclick = reset;
  $('menu').onclick = function(){ show('start'); };

  document.addEventListener('keydown', function(e){
    if(!$('s-play').classList.contains('on') || S.locked) return;
    var n = parseInt(e.key,10);
    if(n>=1 && n<=4){
      var b = $('opts').children[n-1];
      if(b) b.click();
    }
  });
})();