self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={title:'Párchate',body:e.data?e.data.text():''}}
 e.waitUntil((async()=>{const cs=await clients.matchAll({type:'window',includeUncontrolled:true});
  if(cs.some(c=>c.focused&&c.visibilityState==='visible'))return;
  await self.registration.showNotification(d.title||'Párchate',{body:d.body||'',icon:'/icon-192.png',badge:'/icon-192.png',tag:d.tag,renotify:true,data:{chat:d.chat,parche:d.parche}})})())});
self.addEventListener('notificationclick',e=>{e.notification.close();const x=e.notification.data||{};
 e.waitUntil((async()=>{const cs=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of cs){await c.focus();c.postMessage({openChat:x.chat,openParche:x.parche});return}
  await clients.openWindow(x.chat?'/?chat='+x.chat:'/')})())});
