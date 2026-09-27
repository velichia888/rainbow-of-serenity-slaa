// Community gallery. Photos are shrunk and re-saved on the member's device
// before upload, which drops location and camera details (EXIF). They wait in
// gallerySubmissions until a moderator approves them into gallery.
// Photos live in Firestore rather than Firebase Storage because Storage needs
// the paid Blaze plan; see docs/feed-setup.md.

var MAX_SIDE = 1080;
var MAX_BYTES = 350000;
var MAX_PHOTOS = 24;
var POST_GAP_MS = 30000;
var LINK_RE = /(https?:\/\/|www\.)/i;

function $(id){ return document.getElementById(id); }

function loadImage(src){
  return new Promise(function(resolve, reject){
    var img = new Image();
    img.onload = function(){ resolve(img); };
    img.onerror = function(){ reject(new Error('Could not read image')); };
    img.src = src;
  });
}

// Draws the photo onto a blank canvas and saves it as a new JPEG. Only the
// pixels survive, so GPS location, camera model and dates are all gone.
export async function cleanPhoto(src){
  var img = await loadImage(src);
  var side = MAX_SIDE;
  var quality = 0.75;
  for(var i = 0; i < 6; i++){
    var scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    var data = canvas.toDataURL('image/jpeg', quality);
    if(data.length <= MAX_BYTES) return data;
    quality = Math.max(0.5, quality - 0.1);
    side = Math.round(side * 0.85);
  }
  throw new Error('Photo too large');
}

export function startGallery(opts){
  var fs = opts.fs, db = opts.db, auth = opts.auth;
  var isMod = false;
  var gallery = fs.collection(db, 'gallery');
  var submissions = fs.collection(db, 'gallerySubmissions');

  var gridEl = $('gallery-grid');
  var fileEl = $('gallery-file');
  var pickBtn = $('gallery-pick');
  var previewEl = $('gallery-preview');
  var previewImg = $('gallery-preview-img');
  var captionEl = $('gallery-caption');
  var okEl = $('gallery-ok');
  var sendBtn = $('gallery-send');
  var cancelBtn = $('gallery-cancel');
  var statusEl = $('gallery-status');
  var queueEl = $('gallery-queue');
  var queueListEl = $('gallery-queue-list');
  var viewEl = $('gallery-view');
  var viewImg = $('gallery-view-img');
  var viewCaption = $('gallery-view-caption');
  var viewRemove = $('gallery-view-remove');
  var viewClose = $('gallery-view-close');

  var photos = [];
  var pending = null;
  var viewing = null;
  var lastSentAt = 0;
  var stopQueue = null;
  var listening = false;

  function setStatus(msg, isError){
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('error', !!isError);
  }

  function resetForm(){
    pending = null;
    fileEl.value = '';
    captionEl.value = '';
    okEl.checked = false;
    previewImg.removeAttribute('src');
    previewEl.hidden = true;
    pickBtn.hidden = false;
  }

  pickBtn.addEventListener('click', function(){ fileEl.click(); });
  cancelBtn.addEventListener('click', function(){ resetForm(); setStatus(''); });

  fileEl.addEventListener('change', async function(){
    var file = fileEl.files && fileEl.files[0];
    if(!file) return;
    setStatus('Getting your photo ready…');
    var url = URL.createObjectURL(file);
    try{
      pending = await cleanPhoto(url);
      previewImg.src = pending;
      previewEl.hidden = false;
      pickBtn.hidden = true;
      setStatus('');
    }catch(err){
      console.error(err);
      resetForm();
      setStatus('That photo couldn\'t be opened. Try a different one.', true);
    }finally{
      URL.revokeObjectURL(url);
    }
  });

  sendBtn.addEventListener('click', async function(){
    var caption = captionEl.value.trim().slice(0, 120);
    if(!pending){ setStatus('Choose a photo first.', true); return; }
    if(!okEl.checked){ setStatus('Please tick the box to confirm the photo keeps everyone anonymous.', true); return; }
    if(LINK_RE.test(caption)){ setStatus('Links aren\'t allowed, to keep out spam.', true); return; }
    if(Date.now() - lastSentAt < POST_GAP_MS){ setStatus('Please wait 30 seconds between posts.', true); return; }
    var user = auth.currentUser;
    if(!user){ setStatus('Still connecting. Try again in a moment.', true); return; }

    sendBtn.disabled = true;
    setStatus('Sending…');
    try{
      // Shares the feed's "one post per device every 30 seconds" limit.
      var batch = fs.writeBatch(db);
      batch.set(fs.doc(submissions), {
        image: pending,
        caption: caption,
        uid: user.uid,
        createdAt: fs.serverTimestamp()
      });
      batch.set(fs.doc(db, 'rate', user.uid), {last: fs.serverTimestamp()});
      await batch.commit();
      lastSentAt = Date.now();
      resetForm();
      setStatus('Thank you! A moderator will look at it, and it will appear here once approved.');
    }catch(err){
      console.error(err);
      setStatus(err && err.code === 'permission-denied'
        ? 'That didn\'t go through. Please wait 30 seconds and try again.'
        : 'That didn\'t go through. Please try again.', true);
    }finally{
      sendBtn.disabled = false;
    }
  });

  function renderGrid(){
    gridEl.innerHTML = '';
    if(photos.length === 0){
      gridEl.innerHTML = '<p class="empty-note">No photos yet. Share a sunrise, a walk, something you\'re grateful for.</p>';
      return;
    }
    photos.forEach(function(p){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery-thumb';
      btn.setAttribute('aria-label', p.caption ? 'Open photo: ' + p.caption : 'Open photo');
      var img = document.createElement('img');
      img.src = p.image;
      img.alt = p.caption || 'Shared photo';
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', function(){ openView(p); });
      gridEl.appendChild(btn);
    });
  }

  function openView(p){
    viewing = p;
    viewImg.src = p.image;
    viewImg.alt = p.caption || 'Shared photo';
    viewCaption.textContent = p.caption || '';
    viewCaption.hidden = !p.caption;
    viewRemove.hidden = !isMod;
    viewEl.hidden = false;
    viewClose.focus();
  }
  function closeView(){ viewEl.hidden = true; viewing = null; }
  viewClose.addEventListener('click', closeView);
  viewEl.addEventListener('click', function(e){ if(e.target === viewEl) closeView(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !viewEl.hidden) closeView(); });

  viewRemove.addEventListener('click', async function(){
    if(!viewing || !confirm('Remove this photo for everyone?')) return;
    try{
      await fs.deleteDoc(fs.doc(db, 'gallery', viewing.id));
      closeView();
    }catch(err){
      console.error(err);
      alert('That photo couldn\'t be removed. Please try again.');
    }
  });

  // Photos are only downloaded once the gallery is on screen, so opening the
  // app doesn't use anyone's data on pictures they never look at.
  function listen(){
    if(listening) return;
    listening = true;
    gridEl.innerHTML = '<p class="empty-note">Loading photos…</p>';
    fs.onSnapshot(
      fs.query(gallery, fs.orderBy('createdAt', 'desc'), fs.limit(MAX_PHOTOS)),
      function(snap){
        photos = snap.docs.map(function(d){
          var data = d.data();
          return {id: d.id, image: data.image, caption: data.caption};
        });
        renderGrid();
      },
      function(err){
        console.error(err);
        gridEl.innerHTML = '<p class="empty-note">Photos couldn\'t load right now. Please try again later.</p>';
      }
    );
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      if(entries.some(function(e){ return e.isIntersecting; })){ io.disconnect(); listen(); }
    });
    io.observe(gridEl);
  } else {
    listen();
  }

  function renderQueue(items){
    queueListEl.innerHTML = '';
    queueEl.hidden = false;
    if(items.length === 0){
      queueListEl.innerHTML = '<p class="empty-note">Nothing waiting for approval.</p>';
      return;
    }
    items.forEach(function(s){
      var row = document.createElement('div');
      row.className = 'gallery-pending';
      var img = document.createElement('img');
      img.src = s.image;
      img.alt = 'Photo waiting for approval';
      row.appendChild(img);
      if(s.caption){
        var cap = document.createElement('p');
        cap.className = 'feed-text';
        cap.textContent = s.caption;
        row.appendChild(cap);
      }
      var actions = document.createElement('div');
      actions.className = 'gallery-actions';
      var approve = document.createElement('button');
      approve.type = 'button';
      approve.className = 'btn';
      approve.textContent = 'Approve';
      approve.addEventListener('click', function(){ approvePhoto(s, approve); });
      var reject = document.createElement('button');
      reject.type = 'button';
      reject.className = 'btn secondary';
      reject.textContent = 'Remove';
      reject.addEventListener('click', function(){ rejectPhoto(s); });
      actions.appendChild(approve);
      actions.appendChild(reject);
      row.appendChild(actions);
      queueListEl.appendChild(row);
    });
  }

  async function approvePhoto(s, btn){
    btn.disabled = true;
    try{
      // Re-save once more on approval, so even a photo sent some other way
      // than this app has its hidden details stripped before anyone sees it.
      var clean = await cleanPhoto(s.image);
      var batch = fs.writeBatch(db);
      batch.set(fs.doc(gallery), {image: clean, caption: s.caption || '', createdAt: fs.serverTimestamp()});
      batch.delete(fs.doc(db, 'gallerySubmissions', s.id));
      await batch.commit();
    }catch(err){
      console.error(err);
      btn.disabled = false;
      alert('That photo couldn\'t be approved. Please try again.');
    }
  }

  async function rejectPhoto(s){
    if(!confirm('Remove this photo? It won\'t be shown to anyone.')) return;
    try{
      await fs.deleteDoc(fs.doc(db, 'gallerySubmissions', s.id));
    }catch(err){
      console.error(err);
      alert('That photo couldn\'t be removed. Please try again.');
    }
  }

  return {
    setModerator: function(mod){
      isMod = mod;
      if(viewing) viewRemove.hidden = !isMod;
      if(isMod && !stopQueue){
        stopQueue = fs.onSnapshot(
          fs.query(submissions, fs.orderBy('createdAt', 'asc'), fs.limit(20)),
          function(snap){
            renderQueue(snap.docs.map(function(d){
              var data = d.data();
              return {id: d.id, image: data.image, caption: data.caption};
            }));
          },
          function(err){ console.error(err); }
        );
      } else if(!isMod && stopQueue){
        stopQueue();
        stopQueue = null;
        queueEl.hidden = true;
      }
    }
  };
}
