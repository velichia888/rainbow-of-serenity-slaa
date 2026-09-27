// Anonymous visitor count. Adds 1 to today's total in Firestore
// (visits/YYYY-MM-DD) the first time a device opens the site or app each day.
// No cookies, no IDs, nothing about the visitor is stored: the only thing kept
// on the device is the date it was last counted, and the only thing sent is "+1".
(function(){
  var PROJECT = 'rainbow-of-serenity';
  var API_KEY = 'AIzaSyDfr0qFYvjf17HIecXbw_ynqv2t6QGyayY';
  var KEY = 'ros_counted_day';

  var day;
  try{
    // Days roll over at midnight Arizona time.
    day = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Phoenix', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  }catch(e){
    day = new Date().toISOString().slice(0, 10);
  }

  try{ if(localStorage.getItem(KEY) === day) return; }catch(e){}

  var docs = 'projects/' + PROJECT + '/databases/(default)/documents';
  fetch('https://firestore.googleapis.com/v1/' + docs + ':commit?key=' + API_KEY, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    credentials: 'omit',
    keepalive: true,
    body: JSON.stringify({writes: [{transform: {
      document: docs + '/visits/' + day,
      fieldTransforms: [{fieldPath: 'n', increment: {integerValue: '1'}}]
    }}]})
  }).then(function(res){
    if(res.ok){ try{ localStorage.setItem(KEY, day); }catch(e){} }
  }).catch(function(){});
})();
