// Lets the Companion open with no signal. Pages are fetched fresh from the
// network whenever possible (so updates show up right away) and the saved copy
// is only used when the network fails. Firebase traffic is never touched.
var CACHE = 'ros-companion-v2';
var CORE = [
  './',
  './index.html',
  './meeting.ics',
  '../assets/logo-icon.svg',
  '../assets/favicon-32.png',
  '../assets/apple-touch-icon.png',
  '../assets/visits.js',
  '../assets/ui.css',
  '../assets/ui.js',
  '../assets/theme.js'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(CORE); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k.indexOf('ros-companion-') === 0 && k !== CACHE; })
        .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function isFont(url){
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  if(!sameOrigin && !isFont(url)) return;

  // Network first: always try for the newest version, fall back to the saved one.
  event.respondWith(
    fetch(req).then(function(res){
      if(res && (res.ok || res.type === 'opaque')){
        var copy = res.clone();
        caches.open(CACHE).then(function(cache){ cache.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req, {ignoreSearch: true}).then(function(hit){
        if(hit) return hit;
        if(req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
