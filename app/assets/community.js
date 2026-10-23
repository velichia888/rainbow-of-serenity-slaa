// Rainbow of Serenity community safety controls.
// Bundled in both the iOS companion and public community website.
// Reports are private to moderators. Hidden members are stored on this device only.
(async function(){
  'use strict';
  var firebaseConfig = {
    apiKey: "AIzaSyDfr0qFYvjf17HIecXbw_ynqv2t6QGyayY",
    authDomain: "rainbow-of-serenity.firebaseapp.com",
    projectId: "rainbow-of-serenity",
    appId: "1:55750031473:web:5e5033844f8c69a9c243d0"
  };
  var MODERATORS = ['goodmanona@gmail.com', 'rainbowofserenityslaa@gmail.com'];
  var BLOCK_KEY = 'ros_hidden_community_uids_v1';
  var MAX_POSTS = 50, POST_GAP_MS = 30000;
  var LINK_RE = /(https?:\/\/|www\.)/i;
  var EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  var nameEl = document.getElementById('feed-name');
  var textEl = document.getElementById('feed-text');
  var countEl = document.getElementById('feed-count');
  var postBtn = document.getElementById('feed-post');
  var statusEl = document.getElementById('feed-status');
  var listEl = document.getElementById('feed-list');
  var modEl = document.getElementById('feed-mod');
  var modLabelEl = document.getElementById('feed-mod-label');
  var modBtn = document.getElementById('feed-mod-btn');
  var visitsEl = document.getElementById('feed-visits');
  var hiddenStatus = document.getElementById('feed-hidden-status');
  var restoreBtn = document.getElementById('feed-restore-hidden');
  var reportsPanel = document.getElementById('feed-reports');
  var reportsList = document.getElementById('feed-report-list');
  var guidelines = document.getElementById('feed-guidelines');
  var hiddenUids = [];

  try {
    var saved = JSON.parse(localStorage.getItem(BLOCK_KEY) || '[]');
    if(Array.isArray(saved)) hiddenUids = saved.filter(function(uid){ return typeof uid === 'string' && uid.length <= 128; }).slice(0, 300);
    var savedName = localStorage.getItem('ros_feed_name');
    if(savedName) nameEl.value = savedName;
  } catch(e) {}

  function status(message, error){
    statusEl.textContent = message || '';
    statusEl.classList.toggle('error', !!error);
  }
  function persistHidden(){
    try { localStorage.setItem(BLOCK_KEY, JSON.stringify(hiddenUids)); return true; }
    catch(e) { return false; }
  }
  function showHiddenCount(){
    var count = hiddenUids.length;
    hiddenStatus.textContent = count ? count + ' member account(s) blocked on this device.' : '';
    restoreBtn.hidden = !count;
  }
  function timeAgo(date){
    if(!date) return 'just now';
    var seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if(seconds < 60) return 'just now';
    if(seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if(seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if(seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }
  function button(label, action){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'feed-action';
    b.textContent = label;
    b.addEventListener('click', action);
    return b;
  }
  function paragraph(message, className){
    var p = document.createElement('p');
    p.className = className || 'empty-note';
    p.textContent = message;
    return p;
  }
  showHiddenCount();
  restoreBtn.addEventListener('click', function(){
    hiddenUids = [];
    if(!persistHidden()){
      hiddenStatus.textContent = 'Storage is unavailable. Your change may not persist after reopening.';
    }
    showHiddenCount();
    if(typeof redraw === 'function') redraw();
  });
  textEl.addEventListener('input', function(){
    countEl.textContent = textEl.value.length + ' / 500';
  });
  if(guidelines){
    guidelines.textContent = 'Please share only your own recovery experience. No harassment, threats, identifying details, links or spam. Posts are visible to the community. Report harmful posts and block member accounts on this device. Moderators may remove posts; harmful or urgent situations should be reported to the appropriate local services.';
  }

  if(!firebaseConfig.apiKey || !firebaseConfig.projectId){
    document.getElementById('feed-setup').hidden = false;
    document.getElementById('feed-compose').hidden = true;
    listEl.hidden = true;
    return;
  }
  var offlineEl = document.getElementById('feed-offline');
  var composeEl = document.getElementById('feed-compose');
  if(!navigator.onLine){
    offlineEl.hidden = false;
    composeEl.hidden = true;
    listEl.replaceChildren(paragraph('The community feed needs an internet connection.'));
  }
  window.addEventListener('offline', function(){
    offlineEl.hidden = false;
    composeEl.hidden = true;
  });
  window.addEventListener('online', function(){
    offlineEl.hidden = true;
    composeEl.hidden = false;
    if(!started) start().catch(startFailed);
  });

  var started = false, latest = [], isMod = false, db, auth, fs, authMod, feed, reports;
  var stopReports = null;
  var lastPostAt = 0;
  function startFailed(error){
    console.error(error);
    started = false;
    listEl.replaceChildren(paragraph('Community connection failed. Reopen this section when you are connected.'));
    status('Community connection failed. Please try again.', true);
  }
  function redraw(){
    listEl.replaceChildren();
    var visible = latest.filter(function(post){ return !post.uid || !hiddenUids.includes(post.uid); });
    if(visible.length === 0){
      listEl.appendChild(paragraph(latest.length ? 'Posts from blocked accounts are hidden here.' : 'No posts yet. Yours can be the first.'));
      return;
    }
    visible.forEach(function(post){
      var row = document.createElement('article');
      row.className = 'feed-post';
      row.appendChild(paragraph(post.name || 'Anonymous', 'feed-name'));
      row.appendChild(paragraph(timeAgo(post.createdAt), 'feed-time'));
      row.appendChild(paragraph(post.text || '', 'feed-text'));
      var controls = document.createElement('div');
      controls.className = 'feed-actions';

      if(isMod){
        controls.appendChild(button('Remove post', async function(){
          if(!confirm('Remove this post for everyone?')) return;
          try { await fs.deleteDoc(fs.doc(feed, post.id)); }
          catch(error){ console.error(error); status('Unable to remove the post.', true); }
        }));
      }
      if(post.uid && (!auth.currentUser || post.uid !== auth.currentUser.uid)){
        controls.appendChild(button('Block member', function(){
          if(!hiddenUids.includes(post.uid)){
            hiddenUids.push(post.uid);
            if(!persistHidden()) status('Posts blocked for this session, but local storage is unavailable.', true);
          }
          showHiddenCount();
          redraw();
        }));
        controls.appendChild(button('Report post', function(){
          if(row.querySelector('.feed-report-form')) return;
          var form = document.createElement('form');
          form.className = 'feed-report-form';
          var label = document.createElement('label');
          label.textContent = 'Reason for reporting';
          var reason = document.createElement('select');
          reason.setAttribute('aria-label', 'Reason for reporting this post');
          ['Harassment', 'Personal information', 'Spam', 'Other'].forEach(function(value){
            var option = document.createElement('option');
            option.value = value; option.textContent = value; reason.appendChild(option);
          });
          label.appendChild(reason);
          var result = paragraph('', 'feed-report-result');
          result.setAttribute('role', 'status');
          form.appendChild(label);
          form.appendChild(button('Cancel', function(){ form.remove(); }));
          var submit = document.createElement('button');
          submit.type = 'submit'; submit.className = 'feed-action'; submit.textContent = 'Send report';
          form.appendChild(submit);
          form.appendChild(result);
          form.addEventListener('submit', async function(event){
            event.preventDefault();
            var user = auth.currentUser;
            if(!user){ result.textContent = 'Still connecting. Try again shortly.'; return; }
            submit.disabled = true;
            try {
              // Document ID limits duplicate reports for the same post/auth identity.
              var id = user.uid + '_' + post.id;
              await fs.setDoc(fs.doc(reports, id), {
                postId: post.id, reporterUid: user.uid, reason: reason.value,
                status: 'open', createdAt: fs.serverTimestamp()
              });
              result.textContent = 'Report sent privately to the moderators. Thank you.';
              submit.remove();
            } catch(error) {
              console.error(error);
              result.textContent = 'Unable to send. You may have reported this already, or the network is unavailable.';
              submit.disabled = false;
            }
          });
          row.appendChild(form);
        }));
      }
      row.appendChild(controls);
      listEl.appendChild(row);
    });
  }
  function drawReports(snap){
    reportsList.replaceChildren();
    if(snap.empty){
      reportsList.appendChild(paragraph('No open reports.'));
      return;
    }
    snap.docs.forEach(function(item){
      var report = item.data();
      var row = document.createElement('div');
      row.className = 'feed-report-item';
      var post = latest.find(function(p){ return p.id === report.postId; });
      row.appendChild(paragraph('Reason: ' + report.reason, 'feed-name'));
      row.appendChild(paragraph(post ? 'Reported post: ' + post.text : 'Post not present in the latest feed. Check the report before closing.', 'feed-text'));
      var actions = document.createElement('div');
      actions.className = 'feed-actions';
      function resolve(nextStatus, remove){
        return async function(){
          if(remove && !confirm('Delete this post for everyone and close its report?')) return;
          try{
            if(remove){
              // Already-removed posts are harmless to delete again.
              await fs.deleteDoc(fs.doc(feed, report.postId));
            }
            await fs.updateDoc(fs.doc(reports, item.id), {status: nextStatus, reviewedAt: fs.serverTimestamp()});
          }catch(error){
            console.error(error);
            status('Unable to complete moderation action.', true);
          }
        };
      }
      actions.appendChild(button('Remove reported post', resolve('removed', true)));
      actions.appendChild(button('Dismiss report', resolve('dismissed', false)));
      row.appendChild(actions);
      reportsList.appendChild(row);
    });
  }
  function watchReports(){
    if(stopReports){ stopReports(); stopReports = null; }
    reportsPanel.hidden = !isMod;
    if(!isMod) return;
    stopReports = fs.onSnapshot(
      fs.query(reports, fs.where('status', '==', 'open'), fs.limit(50)),
      drawReports,
      function(error){
        console.error(error);
        reportsList.replaceChildren(paragraph('Moderator reports could not be loaded.'));
      }
    );
  }
  function showModLink(){ modEl.hidden = !(location.hash === '#moderate' || isMod); }
  async function showVisits(){
    visitsEl.hidden = true;
    if(!isMod) return;
    try{
      var result = await fs.getDocs(fs.query(fs.collection(db, 'visits'), fs.orderBy(fs.documentId(), 'desc'), fs.limit(30)));
      var todayId = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Phoenix', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
      var today = 0, week = 0, month = 0;
      result.docs.forEach(function(d){
        var n = d.data().n || 0;
        var age = (Date.parse(todayId) - Date.parse(d.id)) / 86400000;
        if(age < 1) today += n;
        if(age < 7) week += n;
        if(age < 30) month += n;
      });
      visitsEl.textContent = 'Visitors today: ' + today + ' · last 7 days: ' + week + ' · last 30 days: ' + month;
      visitsEl.hidden = false;
    } catch(error) { console.error(error); }
  }
  async function start(){
    if(started) return;
    started = true;
    offlineEl.hidden = true;
    composeEl.hidden = false;
    try{
      var sdk = 'https://www.gstatic.com/firebasejs/10.12.2/';
      var appMod = await import(sdk + 'firebase-app.js');
      fs = await import(sdk + 'firebase-firestore.js');
      authMod = await import(sdk + 'firebase-auth.js');
      var app = appMod.initializeApp(firebaseConfig);
      db = fs.getFirestore(app);
      auth = authMod.getAuth(app);
      feed = fs.collection(db, 'feed');
      reports = fs.collection(db, 'reports');
    }catch(error){
      started = false;
      throw error;
    }
    authMod.onAuthStateChanged(auth, function(user){
      if(!user){
        authMod.signInAnonymously(auth).catch(function(error){ console.error(error); status('Could not connect to Community.', true); });
        return;
      }
      isMod = !user.isAnonymous && MODERATORS.includes(user.email);
      modLabelEl.textContent = user.isAnonymous ? '' : 'Signed in as ' + user.email + (isMod ? '' : ' (not a moderator)') + '.';
      modBtn.textContent = user.isAnonymous ? 'Moderator sign-in' : 'Sign out';
      showModLink();
      watchReports();
      showVisits();
      redraw();
    });
    window.addEventListener('hashchange', showModLink);
    showModLink();
    modBtn.addEventListener('click', async function(){
      try{
        if(auth.currentUser && !auth.currentUser.isAnonymous) await authMod.signOut(auth);
        else await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
      }catch(error){
        console.error(error);
        status('Moderator sign-in failed. Try the community website in a desktop browser.', true);
      }
    });
    fs.onSnapshot(
      fs.query(feed, fs.orderBy('createdAt','desc'), fs.limit(MAX_POSTS)),
      function(snap){
        latest = snap.docs.map(function(d){
          var p = d.data({serverTimestamps:'estimate'});
          return {
            id:d.id, uid:p.uid, name:p.name, text:p.text,
            createdAt:p.createdAt && p.createdAt.toDate ? p.createdAt.toDate() : null
          };
        });
        redraw();
      },
      function(error){
        console.error(error);
        listEl.replaceChildren(paragraph('The feed could not load. Please try again later.'));
      }
    );
    setInterval(function(){ if(latest.length) redraw(); }, 60000);
  }

  postBtn.addEventListener('click', async function(){
    var message = textEl.value.trim();
    var name = nameEl.value.trim().slice(0,30);
    if(!message){ status('Write something first.', true); return; }
    if(message.length > 500){ status('Please keep posts under 500 characters.', true); return; }
    if(LINK_RE.test(message) || LINK_RE.test(name) || EMAIL_RE.test(message) || EMAIL_RE.test(name)){
      status('Please remove links or email addresses before posting.', true); return;
    }
    if(Date.now() - lastPostAt < POST_GAP_MS){ status('Please wait 30 seconds between posts.', true); return; }
    var user = auth && auth.currentUser;
    if(!user){ status('Still connecting. Try again in a moment.', true); return; }
    postBtn.disabled = true;
    status('Posting…');
    try{
      var batch = fs.writeBatch(db);
      batch.set(fs.doc(feed), {name:name || 'Anonymous', text:message, uid:user.uid, createdAt:fs.serverTimestamp()});
      batch.set(fs.doc(db, 'rate', user.uid), {last:fs.serverTimestamp()});
      await batch.commit();
      lastPostAt = Date.now();
      try { localStorage.setItem('ros_feed_name', name); } catch(e) {}
      textEl.value = ''; countEl.textContent = '0 / 500';
      status('Posted.');
    }catch(error){
      console.error(error);
      status('Post not sent. Check the community rules and try again shortly.', true);
    }finally{
      postBtn.disabled = false;
    }
  });
  if(navigator.onLine) start().catch(startFailed);
})();