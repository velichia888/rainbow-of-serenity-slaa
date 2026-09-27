// Picks light or dark before the page draws, so there's no flash.
// Saved choice: 'light', 'dark', or nothing (follow the phone).
(function(){
  var KEY = 'ros_theme', root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function saved(){ try{ return localStorage.getItem(KEY) || 'auto'; }catch(e){ return 'auto'; } }
  function apply(){
    var pref = saved();
    var dark = pref === 'dark' || (pref === 'auto' && mq && mq.matches);
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', pref);
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for(var i = 0; i < metas.length; i++){ metas[i].removeAttribute('media'); metas[i].setAttribute('content', dark ? '#1c1a20' : '#fffaf3'); }
  }
  window.rosTheme = {
    get: saved,
    set: function(pref){ try{ if(pref === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, pref); }catch(e){} apply(); }
  };
  if(mq){ if(mq.addEventListener) mq.addEventListener('change', apply); else if(mq.addListener) mq.addListener(apply); }
  apply();
})();
