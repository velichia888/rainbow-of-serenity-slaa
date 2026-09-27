// Shared by the site, the app and the docs pages.
(function(){
  // Quick exit: replace this page with a neutral one. location.replace keeps
  // this site out of the Back button's history.
  var EXIT_URL = 'https://weather.com/';
  function exit(){ try{ document.body.style.display = 'none'; }catch(e){} window.location.replace(EXIT_URL); }
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'quick-exit';
  btn.setAttribute('aria-label', 'Quick exit: leave this site now');
  btn.textContent = '✕ Quick exit';
  btn.addEventListener('click', exit);
  document.body.appendChild(btn);

  // Theme button: cycles Auto (follow the phone) -> Light -> Dark.
  if(window.rosTheme){
    var ICON = {
      auto:'<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/>',
      light:'<circle cx="8" cy="8" r="3.2" fill="currentColor"/><path d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
      dark:'<path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7z" fill="currentColor"/>'
    };
    var NAMES = {auto:'Auto', light:'Light', dark:'Dark'};
    var NEXT = {auto:'light', light:'dark', dark:'auto'};
    var tb = document.createElement('button');
    tb.type = 'button';
    tb.className = 'theme-btn';
    var sync = function(){
      var t = window.rosTheme.get();
      if(!NAMES[t]) t = 'auto';
      tb.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true">' + ICON[t] + '</svg><span>' + NAMES[t] + '</span>';
      tb.setAttribute('aria-label', 'Color theme: ' + t + '. Tap to change.');
    };
    tb.addEventListener('click', function(){ window.rosTheme.set(NEXT[window.rosTheme.get()] || 'auto'); sync(); });
    sync();
    var nav = document.querySelector('nav.top-nav');
    var appHead = document.querySelector('.app-header .header-inner');
    var back = document.querySelector('a.back');
    if(nav) nav.appendChild(tb);
    else if(appHead) appHead.insertBefore(tb, document.getElementById('text-size-btn'));
    else if(back){ back.parentNode.classList.add('back-row'); back.parentNode.appendChild(tb); }
  }

  // Next meeting: Wednesdays 3:00 PM Arizona time (UTC-7 all year) = 22:00 UTC, 30 minutes.
  var strips = document.querySelectorAll('[data-next-meeting]');
  if(!strips.length) return;
  var ZOOM = 'https://us05web.zoom.us/j/85842817235?pwd=ghovWKygdqMA0HRia235bvBVblzVXP.1';
  var LENGTH = 30 * 60000, EARLY = 10 * 60000;
  function nextStart(now){
    var t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22, 0, 0));
    t.setUTCDate(t.getUTCDate() + (3 - t.getUTCDay() + 7) % 7);
    if(t.getTime() + LENGTH <= now.getTime()) t.setUTCDate(t.getUTCDate() + 7);
    return t;
  }
  function localTime(t){
    try{
      var az = t.toLocaleTimeString('en-US', {timeZone:'America/Phoenix', hour:'numeric', minute:'2-digit'});
      var mine = t.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'});
      return az === mine ? '' : ' (' + mine + ' your time)';
    }catch(e){ return ''; }
  }
  strips.forEach(function(el){
    el.classList.add('next-meeting');
    el.innerHTML =
      '<div class="nm-when"><span class="nm-label"></span><span class="nm-count"></span><span class="nm-date"></span></div>' +
      '<a class="nm-join" target="_blank" rel="noopener">Join Zoom</a>';
    el.querySelector('.nm-join').href = ZOOM;
  });
  function update(){
    var now = new Date(), start = nextStart(now), diff = start - now;
    var live = diff <= EARLY, on = diff <= 0;
    var label = on ? 'Meeting is on now' : live ? 'Starting soon' : 'Next meeting';
    var count;
    if(on) count = 'Join us';
    else{
      var d = Math.floor(diff / 86400000), h = Math.floor(diff % 86400000 / 3600000), m = Math.ceil(diff % 3600000 / 60000);
      if(m === 60){ h++; m = 0; }
      count = 'in ' + (d ? d + 'd ' : '') + (d || h ? h + 'h ' : '') + m + 'm';
    }
    var date = start.toLocaleDateString('en-US', {timeZone:'UTC', weekday:'long', month:'short', day:'numeric'}) +
      ', 3:00 PM Arizona' + localTime(start);
    strips.forEach(function(el){
      el.classList.toggle('is-live', live);
      el.querySelector('.nm-label').textContent = label;
      el.querySelector('.nm-count').textContent = count;
      el.querySelector('.nm-date').textContent = date;
      el.querySelector('.nm-join').textContent = live ? 'Join Zoom now' : 'Join Zoom';
    });
  }
  update();
  setInterval(update, 15000);
})();
