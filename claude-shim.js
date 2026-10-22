// Adaptateur : fournit à l'application les services db / user / assets / downloads via Supabase.
(()=>{
const C=window.CFG,sb=supabase.createClient(C.supabaseUrl,C.anonKey);
let authP=null;
const auth=()=>authP||(authP=(async()=>{let{data}=await sb.auth.getSession();
 if(!data.session){const r=await sb.auth.signInAnonymously();if(r.error)throw r.error;data=r.data}
 return data.session.user})());
const split=p=>{const a=p.split("/");return{coll:a.slice(0,-1).join("/"),id:a[a.length-1]}};
const sd=r=>({id:r?r.id:"",exists:!!r,data:()=>r?r.data:undefined,metadata:{fromCache:false,hasPendingWrites:false}});
const sq=rows=>({docs:rows.map(sd),size:rows.length,empty:!rows.length,docChanges:()=>[],metadata:{}});
const uid=()=>crypto.randomUUID();
async function getDoc(p){await auth();const{coll,id}=split(p);
 const{data,error}=await sb.from("docs").select("id,data").eq("coll",coll).eq("id",id).maybeSingle();if(error)throw error;return data}
function watch(coll,fetcher,next,err){let on=true;
 const run=()=>fetcher().then(s=>on&&next(s),e=>err&&err({code:"unavailable",message:e.message||String(e)}));
 run();auth().then(()=>{if(!on)return;ch=sb.channel("c"+uid()).on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:"coll=eq."+coll},run).subscribe()});
 let ch;return()=>{on=false;if(ch)sb.removeChannel(ch)}}
function Query(coll,ord,lim){
 const fetchQ=async()=>{await auth();const{data,error}=await sb.from("docs").select("id,data").eq("coll",coll).order("created_at");if(error)throw error;
  let r=data;if(ord){const k=ord.f,m=ord.d=="desc"?-1:1;r=[...r].sort((a,b)=>((a.data[k]>b.data[k])-(a.data[k]<b.data[k]))*m)}
  if(lim)r=r.slice(0,lim);return sq(r)};
 const q={orderBy:(f,d)=>Query(coll,{f,d},lim),limit:n=>Query(coll,ord,n),where:()=>q,get:fetchQ,
  onSnapshot:(n,e)=>watch(coll,fetchQ,n,e)};return q}
function DocRef(p){const{coll,id}=split(p);return{id,path:p,
 get:async()=>sd(await getDoc(p)),
 set:async d=>{await auth();const{error}=await sb.from("docs").upsert({coll,id,data:d});if(error)throw error},
 update:async d=>{await auth();const{error}=await sb.rpc("merge_doc",{p_coll:coll,p_id:id,p_data:d});if(error)throw error},
 delete:async()=>{await auth();const{error}=await sb.from("docs").delete().eq("coll",coll).eq("id",id);if(error)throw error},
 onSnapshot:(n,e)=>watch(coll,async()=>sd(await getDoc(p)),n,e)}}
const db={doc:DocRef,collection:c=>({...Query(c),path:c,doc:id=>DocRef(c+"/"+(id||uid())),
 add:async d=>{const id=uid(),r=DocRef(c+"/"+id);await r.set(d);return r}})};
const user={isOwner:async()=>false,canEdit:async()=>true,can:async()=>true,
 me:async()=>{const u=await auth();return{id:u.id,name:"",avatarUrl:"",color:"",email:null,isOwner:false,canEdit:true}},
 id:async()=>(await auth()).id};
const assets={async upload(blob){const u=await auth(),ext=(blob.type.split("/")[1]||"png").replace(/[^a-z0-9]/gi,""),path=u.id+"/"+uid()+"."+ext;
 const{error}=await sb.storage.from("visuals").upload(path,blob,{contentType:blob.type});if(error)throw error;
 return{id:path,url:sb.storage.from("visuals").getPublicUrl(path).data.publicUrl,sizeBytes:blob.size,contentType:blob.type}}};
const downloads={async save({filename,data}){const b=data instanceof Blob?data:new Blob([data]),a=document.createElement("a");
 a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}};
window.claude={use:async n=>({db,user,assets,downloads}[n]||null)};
})();
