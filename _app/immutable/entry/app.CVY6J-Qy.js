const __vite__fileDeps=["_app/immutable/nodes/0.CvqaETMs.js","_app/immutable/chunks/disclose-version.VlcF2N1U.js","_app/immutable/chunks/runtime.NqF6ywm4.js","_app/immutable/chunks/props.dsyMs83D.js","_app/immutable/chunks/repo.D9KUsRR3.js","_app/immutable/chunks/index-client.UANBtXg8.js","_app/immutable/chunks/repos.CcHmjfZk.js","_app/immutable/assets/0.B_TOGsGU.css","_app/immutable/nodes/1.BWlgEPti.js","_app/immutable/chunks/stores.Cx--q540.js","_app/immutable/chunks/entry.BqblJyQI.js","_app/immutable/nodes/2.HPMVuXwL.js","_app/immutable/chunks/Library_Footer.CEBRlOOR.js","_app/immutable/assets/Library_Footer.CLN3jOpO.css","_app/immutable/chunks/Spider.D8CNwx9Z.js","_app/immutable/assets/Spider.CtNwUba2.css","_app/immutable/assets/2.D19JxBzO.css","_app/immutable/nodes/3.DhKCT0MT.js","_app/immutable/chunks/Package_Detail.DknASV9X.js","_app/immutable/assets/Package_Detail.D3gJ9K1h.css","_app/immutable/chunks/Page_Header.CGDX8AQL.js","_app/immutable/assets/Page_Header.B3fuo5Hm.css","_app/immutable/assets/3.CUM1G7ha.css","_app/immutable/nodes/4.ZcGh3h-w.js","_app/immutable/assets/4.CynVuh4a.css","_app/immutable/nodes/5.t6RMhsuH.js","_app/immutable/chunks/github_helpers.wFZESeOv.js","_app/immutable/assets/5.BZgOtQoF.css","_app/immutable/nodes/6.D-JAdsYz.js","_app/immutable/assets/6.B-GrCAwC.css","_app/immutable/nodes/7.DADbBL8F.js","_app/immutable/chunks/Repos_Tree.LL78z4wi.js","_app/immutable/assets/Repos_Tree.DRwqVZfx.css","_app/immutable/assets/7.BAHkQeZ2.css","_app/immutable/nodes/8.o--1tkbR.js","_app/immutable/assets/8.D3SRJYF7.css"],__vite__mapDeps=i=>i.map(i=>__vite__fileDeps[i]);
var S=s=>{throw TypeError(s)};var q=(s,t,e)=>t.has(s)||S("Cannot "+e);var u=(s,t,e)=>(q(s,t,"read from private field"),e?e.call(s):t.get(s)),L=(s,t,e)=>t.has(s)?S("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(s):t.set(s,e),O=(s,t,e,i)=>(q(s,t,"write to private field"),i?i.call(s,e):t.set(s,e),e);import{w as F,y as G,z as H,g as y,k as A,J as M,h as Q,D as X,p as Y,K as Z,b as N,a as $,M as tt,s as k,t as et}from"../chunks/runtime.NqF6ywm4.js";import{g as U,i as rt,m as st,z as nt,A as ot,B as at,f as x,v as D,a as E,s as j,t as B,c as it,e as ct,b as ut,r as lt}from"../chunks/disclose-version.VlcF2N1U.js";import{p as T,i as p,a as _t}from"../chunks/props.dsyMs83D.js";import{o as dt,b as I}from"../chunks/index-client.UANBtXg8.js";function V(s,t,e){U&&rt();var i=s,a,o;F(()=>{a!==(a=t())&&(o&&(H(o),o=null),a&&(o=G(()=>e(i,a))))}),U&&(i=st)}function ft(s){return class extends mt{constructor(t){super({component:s,...t})}}}var v,l;class mt{constructor(t){L(this,v);L(this,l);var o;var e=new Map,i=(n,r)=>{var c=X(r);return e.set(n,c),c};const a=new Proxy({...t.props||{},$$events:{}},{get(n,r){return y(e.get(r)??i(r,Reflect.get(n,r)))},has(n,r){return y(e.get(r)??i(r,Reflect.get(n,r))),Reflect.has(n,r)},set(n,r,c){return A(e.get(r)??i(r,c),c),Reflect.set(n,r,c)}});O(this,l,(t.hydrate?nt:ot)(t.component,{target:t.target,props:a,context:t.context,intro:t.intro??!1,recover:t.recover})),(o=t==null?void 0:t.props)!=null&&o.$$host||M(),O(this,v,a.$$events);for(const n of Object.keys(u(this,l)))n==="$set"||n==="$destroy"||n==="$on"||Q(this,n,{get(){return u(this,l)[n]},set(r){u(this,l)[n]=r},enumerable:!0});u(this,l).$set=n=>{Object.assign(a,n)},u(this,l).$destroy=()=>{at(u(this,l))}}$set(t){u(this,l).$set(t)}$on(t,e){u(this,v)[t]=u(this,v)[t]||[];const i=(...a)=>e.call(this,...a);return u(this,v)[t].push(i),()=>{u(this,v)[t]=u(this,v)[t].filter(a=>a!==i)}}$destroy(){u(this,l).$destroy()}}v=new WeakMap,l=new WeakMap;const ht="modulepreload",vt=function(s){return"/"+s},z={},h=function(t,e,i){let a=Promise.resolve();if(e&&e.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),n=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));a=Promise.all(e.map(r=>{if(r=vt(r),r in z)return;z[r]=!0;const c=r.endsWith(".css"),R=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${R}`))return;const f=document.createElement("link");if(f.rel=c?"stylesheet":ht,c||(f.as="script",f.crossOrigin=""),f.href=r,n&&f.setAttribute("nonce",n),document.head.appendChild(f),c)return new Promise((m,_)=>{f.addEventListener("load",m),f.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${r}`)))})}))}return a.then(()=>t()).catch(o=>{const n=new Event("vite:preloadError",{cancelable:!0});if(n.payload=o,window.dispatchEvent(n),!n.defaultPrevented)throw o})},Lt={};var gt=B('<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>'),Et=B("<!> <!>",1);function yt(s,t){Y(t,!0);let e=T(t,"components",23,()=>[]),i=T(t,"data_0",3,null),a=T(t,"data_1",3,null);Z(()=>t.stores.page.set(t.page)),N(()=>{t.stores,t.page,t.constructors,e(),t.form,i(),a(),t.stores.page.notify()});let o=k(!1),n=k(!1),r=k(null);dt(()=>{const m=t.stores.page.subscribe(()=>{y(o)&&(A(n,!0),tt().then(()=>{A(r,_t(document.title||"untitled page"))}))});return A(o,!0),m});var c=Et(),R=x(c);p(R,()=>t.constructors[1],m=>{var _=D(),b=x(_);V(b,()=>t.constructors[0],(P,g)=>{I(g(P,{get data(){return i()},children:(d,bt)=>{var C=D(),J=x(C);V(J,()=>t.constructors[1],(K,W)=>{I(W(K,{get data(){return a()},get form(){return t.form}}),w=>e()[1]=w,()=>{var w;return(w=e())==null?void 0:w[1]})}),E(d,C)},$$slots:{default:!0}}),d=>e()[0]=d,()=>{var d;return(d=e())==null?void 0:d[0]})}),E(m,_)},m=>{var _=D(),b=x(_);V(b,()=>t.constructors[0],(P,g)=>{I(g(P,{get data(){return i()},get form(){return t.form}}),d=>e()[0]=d,()=>{var d;return(d=e())==null?void 0:d[0]})}),E(m,_)});var f=j(j(R,!0));p(f,()=>y(o),m=>{var _=gt(),b=it(_);p(b,()=>y(n),P=>{var g=ct();et(()=>ut(g,y(r))),E(P,g)}),lt(_),E(m,_)}),E(s,c),$()}const Ot=ft(yt),kt=[()=>h(()=>import("../nodes/0.CvqaETMs.js"),__vite__mapDeps([0,1,2,3,4,5,6,7])),()=>h(()=>import("../nodes/1.BWlgEPti.js"),__vite__mapDeps([8,1,2,9,10])),()=>h(()=>import("../nodes/2.HPMVuXwL.js"),__vite__mapDeps([11,1,2,4,12,3,13,9,10,14,15,16])),()=>h(()=>import("../nodes/3.DhKCT0MT.js"),__vite__mapDeps([17,1,2,18,3,4,9,10,12,13,19,14,15,20,21,22])),()=>h(()=>import("../nodes/4.ZcGh3h-w.js"),__vite__mapDeps([23,1,2,20,12,3,4,13,9,10,21,24])),()=>h(()=>import("../nodes/5.t6RMhsuH.js"),__vite__mapDeps([25,1,2,20,12,3,4,13,9,10,21,26,27])),()=>h(()=>import("../nodes/6.D-JAdsYz.js"),__vite__mapDeps([28,1,2,20,12,3,4,13,9,10,21,26,29])),()=>h(()=>import("../nodes/7.DADbBL8F.js"),__vite__mapDeps([30,1,2,20,12,3,4,13,9,10,21,31,18,19,32,33])),()=>h(()=>import("../nodes/8.o--1tkbR.js"),__vite__mapDeps([34,4,1,2,6,9,10,3,20,12,13,21,31,18,19,32,35]))],Dt=[],Tt={"/":[2],"/about":[3],"/modules":[4],"/pull_requests":[5],"/table":[6],"/tree":[7],"/tree/[slug]":[8]},pt={handleError:({error:s})=>{console.error(s)},reroute:()=>{}};export{Tt as dictionary,pt as hooks,Lt as matchers,kt as nodes,Ot as root,Dt as server_loads};
