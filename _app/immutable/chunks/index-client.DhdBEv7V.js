var bn=Array.isArray,Mn=Array.from,Pn=Object.defineProperty,it=Object.getOwnPropertyDescriptor,Kt=Object.getOwnPropertyDescriptors,Ln=Object.prototype,qn=Array.prototype,$t=Object.getPrototypeOf;function Hn(t){return typeof t=="function"}const Yn=()=>{};function Zt(t){for(var n=0;n<t.length;n++)t[n]()}const y=2,pt=4,Y=8,st=16,T=32,z=64,Q=128,R=256,G=512,h=1024,x=2048,j=4096,F=8192,b=16384,zt=32768,ht=65536,Jt=1<<19,dt=1<<20,ft=Symbol("$state"),jn=Symbol("legacy props"),Bn=Symbol("");function Et(t){return t===this.v}function Wt(t,n){return t!=t?n==n:t!==n||t!==null&&typeof t=="object"||typeof t=="function"}function Xt(t){return!Wt(t,this.v)}function Qt(t){throw new Error("https://svelte.dev/e/effect_in_teardown")}function tn(){throw new Error("https://svelte.dev/e/effect_in_unowned_derived")}function nn(t){throw new Error("https://svelte.dev/e/effect_orphan")}function rn(){throw new Error("https://svelte.dev/e/effect_update_depth_exceeded")}function Un(){throw new Error("https://svelte.dev/e/hydration_failed")}function Vn(t){throw new Error("https://svelte.dev/e/props_invalid_value")}function Gn(){throw new Error("https://svelte.dev/e/state_descriptors_fixed")}function Kn(){throw new Error("https://svelte.dev/e/state_prototype_fixed")}function en(){throw new Error("https://svelte.dev/e/state_unsafe_local_read")}function sn(){throw new Error("https://svelte.dev/e/state_unsafe_mutation")}let ln=!1;const $n=1,Zn=2,zn=4,Jn=8,Wn=16,Xn=1,Qn=4,tr=8,nr=16,rr=4,er=1,sr=2,on="[",an="[!",un="]",yt={},lr=Symbol(),or="http://www.w3.org/2000/svg";function wt(t,n){var r={f:0,v:t,reactions:null,equals:Et,version:0};return r}function ar(t){return fn(wt(t))}function ur(t,n=!1){const r=wt(t);return n||(r.equals=Xt),r}function fn(t){return u!==null&&u.f&y&&(m===null?gn([t]):m.push(t)),t}function ir(t,n){return u!==null&&Sn()&&u.f&(y|st)&&(m===null||!m.includes(t))&&sn(),_n(t,n)}function _n(t,n){return t.equals(n)||(t.v=n,t.version=qt(),mt(t,x),a!==null&&a.f&h&&!(a.f&T)&&(v!==null&&v.includes(t)?(A(a,x),X(a)):g===null?xn([t]):g.push(t))),n}function mt(t,n){var r=t.reactions;if(r!==null)for(var e=r.length,s=0;s<e;s++){var l=r[s],o=l.f;o&x||(A(l,n),o&(h|R)&&(o&y?mt(l,j):X(l)))}}function Tt(t){console.warn("https://svelte.dev/e/hydration_mismatch")}let D=!1;function fr(t){D=t}let w;function P(t){if(t===null)throw Tt(),yt;return w=t}function _r(){return P(C(w))}function cr(t){if(D){if(C(w)!==null)throw Tt(),yt;w=t}}function vr(t=1){if(D){for(var n=t,r=w;n--;)r=C(r);w=r}}function pr(){for(var t=0,n=w;;){if(n.nodeType===8){var r=n.data;if(r===un){if(t===0)return n;t-=1}else(r===on||r===an)&&(t+=1)}var e=C(n);n.remove(),n=e}}var _t,cn,At,gt;function hr(){if(_t===void 0){_t=window,cn=document;var t=Element.prototype,n=Node.prototype;At=it(n,"firstChild").get,gt=it(n,"nextSibling").get,t.__click=void 0,t.__className="",t.__attributes=null,t.__styles=null,t.__e=void 0,Text.prototype.__t=void 0}}function tt(t=""){return document.createTextNode(t)}function nt(t){return At.call(t)}function C(t){return gt.call(t)}function dr(t,n){if(!D)return nt(t);var r=nt(w);if(r===null)r=w.appendChild(tt());else if(n&&r.nodeType!==3){var e=tt();return r==null||r.before(e),P(e),e}return P(r),r}function Er(t,n){if(!D){var r=nt(t);return r instanceof Comment&&r.data===""?C(r):r}return w}function yr(t,n=1,r=!1){let e=D?w:t;for(var s;n--;)s=e,e=C(e);if(!D)return e;var l=e==null?void 0:e.nodeType;if(r&&l!==3){var o=tt();return e===null?s==null||s.after(o):e.before(o),P(o),o}return P(e),e}function wr(t){t.textContent=""}function mr(t){var n=y|x;a===null?n|=R:a.f|=dt;var r=u!==null&&u.f&y?u:null;const e={children:null,ctx:i,deps:null,equals:Et,f:n,fn:t,reactions:null,v:null,version:0,parent:r??a};return r!==null&&(r.children??(r.children=[])).push(e),e}function xt(t){var n=t.children;if(n!==null){t.children=null;for(var r=0;r<n.length;r+=1){var e=n[r];e.f&y?lt(e):O(e)}}}function vn(t){for(var n=t.parent;n!==null;){if(!(n.f&y))return n;n=n.parent}return null}function St(t){var n,r=a;Z(vn(t));try{xt(t),n=Ht(t)}finally{Z(r)}return n}function It(t){var n=St(t),r=(I||t.f&R)&&t.deps!==null?j:h;A(t,r),t.equals(n)||(t.v=n,t.version=qt())}function lt(t){xt(t),H(t,0),A(t,b),t.v=t.children=t.deps=t.ctx=t.reactions=null}function Dt(t){a===null&&u===null&&nn(),u!==null&&u.f&R&&tn(),at&&Qt()}function pn(t,n){var r=n.last;r===null?n.last=n.first=t:(r.next=t,t.prev=r,n.last=t)}function M(t,n,r,e=!0){var s=(t&z)!==0,l=a,o={ctx:i,deps:null,deriveds:null,nodes_start:null,nodes_end:null,f:t|x,first:null,fn:n,last:null,next:null,parent:s?null:l,prev:null,teardown:null,transitions:null,version:0};if(r){var c=N;try{ct(!0),W(o),o.f|=zt}catch(f){throw O(o),f}finally{ct(c)}}else n!==null&&X(o);var p=r&&o.deps===null&&o.first===null&&o.nodes_start===null&&o.teardown===null&&(o.f&dt)===0;if(!p&&!s&&e&&(l!==null&&pn(o,l),u!==null&&u.f&y)){var d=u;(d.children??(d.children=[])).push(o)}return o}function Tr(t){const n=M(Y,null,!1);return A(n,h),n.teardown=t,n}function hn(t){Dt();var n=a!==null&&(a.f&T)!==0&&i!==null&&!i.m;if(n){var r=i;(r.e??(r.e=[])).push({fn:t,effect:a,reaction:u})}else{var e=Ot(t);return e}}function Ar(t){return Dt(),dn(t)}function gr(t){const n=M(z,t,!0);return(r={})=>new Promise(e=>{r.outro?wn(n,()=>{O(n),e(void 0)}):(O(n),e(void 0))})}function Ot(t){return M(pt,t,!1)}function dn(t){return M(Y,t,!0)}function xr(t){return En(t)}function En(t,n=0){return M(Y|st|n,t,!0)}function Sr(t,n=!0){return M(Y|T,t,!0,n)}function Rt(t){var n=t.teardown;if(n!==null){const r=at,e=u;vt(!0),$(null);try{n.call(null)}finally{vt(r),$(e)}}}function Ct(t){var n=t.deriveds;if(n!==null){t.deriveds=null;for(var r=0;r<n.length;r+=1)lt(n[r])}}function Nt(t,n=!1){var r=t.first;for(t.first=t.last=null;r!==null;){var e=r.next;O(r,n),r=e}}function yn(t){for(var n=t.first;n!==null;){var r=n.next;n.f&T||O(n),n=r}}function O(t,n=!0){var r=!1;if((n||t.f&Jt)&&t.nodes_start!==null){for(var e=t.nodes_start,s=t.nodes_end;e!==null;){var l=e===s?null:C(e);e.remove(),e=l}r=!0}Nt(t,n&&!r),Ct(t),H(t,0),A(t,b);var o=t.transitions;if(o!==null)for(const p of o)p.stop();Rt(t);var c=t.parent;c!==null&&c.first!==null&&kt(t),t.next=t.prev=t.teardown=t.ctx=t.deps=t.fn=t.nodes_start=t.nodes_end=null}function kt(t){var n=t.parent,r=t.prev,e=t.next;r!==null&&(r.next=e),e!==null&&(e.prev=r),n!==null&&(n.first===t&&(n.first=e),n.last===t&&(n.last=r))}function wn(t,n){var r=[];Ft(t,r,!0),mn(r,()=>{O(t),n&&n()})}function mn(t,n){var r=t.length;if(r>0){var e=()=>--r||n();for(var s of t)s.out(e)}else n()}function Ft(t,n,r){if(!(t.f&F)){if(t.f^=F,t.transitions!==null)for(const o of t.transitions)(o.is_global||r)&&n.push(o);for(var e=t.first;e!==null;){var s=e.next,l=(e.f&ht)!==0||(e.f&T)!==0;Ft(e,n,l?r:!1),e=s}}}function Ir(t){bt(t,!0)}function bt(t,n){if(t.f&F){B(t)&&W(t),t.f^=F;for(var r=t.first;r!==null;){var e=r.next,s=(r.f&ht)!==0||(r.f&T)!==0;bt(r,s?n:!1),r=e}if(t.transitions!==null)for(const l of t.transitions)(l.is_global||n)&&l.in()}}let K=!1,rt=[];function Mt(){K=!1;const t=rt.slice();rt=[],Zt(t)}function Dr(t){K||(K=!0,queueMicrotask(Mt)),rt.push(t)}function Tn(){K&&Mt()}function ot(t){throw new Error("https://svelte.dev/e/lifecycle_outside_component")}const Pt=0,An=1;let U=!1,V=Pt,L=!1,q=null,N=!1,at=!1;function ct(t){N=t}function vt(t){at=t}let S=[],k=0;let u=null;function $(t){u=t}let a=null;function Z(t){a=t}let m=null;function gn(t){m=t}let v=null,E=0,g=null;function xn(t){g=t}let Lt=1,I=!1,i=null;function qt(){return++Lt}function Sn(){return!ln}function B(t){var o,c;var n=t.f;if(n&x)return!0;if(n&j){var r=t.deps,e=(n&R)!==0;if(r!==null){var s;if(n&G){for(s=0;s<r.length;s++)((o=r[s]).reactions??(o.reactions=[])).push(t);t.f^=G}for(s=0;s<r.length;s++){var l=r[s];if(B(l)&&It(l),e&&a!==null&&!I&&!((c=l==null?void 0:l.reactions)!=null&&c.includes(t))&&(l.reactions??(l.reactions=[])).push(t),l.version>t.version)return!0}}(!e||a!==null&&!I)&&A(t,h)}return!1}function In(t,n){for(var r=n;r!==null;){if(r.f&Q)try{r.fn(t);return}catch{r.f^=Q}r=r.parent}throw U=!1,t}function Dn(t){return(t.f&b)===0&&(t.parent===null||(t.parent.f&Q)===0)}function J(t,n,r,e){if(U){if(r===null&&(U=!1),Dn(n))throw t;return}r!==null&&(U=!0);{In(t,n);return}}function Ht(t){var ut;var n=v,r=E,e=g,s=u,l=I,o=m,c=i,p=t.f;v=null,E=0,g=null,u=p&(T|z)?null:t,I=!N&&(p&R)!==0,m=null,i=t.ctx;try{var d=(0,t.fn)(),f=t.deps;if(v!==null){var _;if(H(t,E),f!==null&&E>0)for(f.length=E+v.length,_=0;_<v.length;_++)f[E+_]=v[_];else t.deps=f=v;if(!I)for(_=E;_<f.length;_++)((ut=f[_]).reactions??(ut.reactions=[])).push(t)}else f!==null&&E<f.length&&(H(t,E),f.length=E);return d}finally{v=n,E=r,g=e,u=s,I=l,m=o,i=c}}function On(t,n){let r=n.reactions;if(r!==null){var e=r.indexOf(t);if(e!==-1){var s=r.length-1;s===0?r=n.reactions=null:(r[e]=r[s],r.pop())}}r===null&&n.f&y&&(v===null||!v.includes(n))&&(A(n,j),n.f&(R|G)||(n.f^=G),H(n,0))}function H(t,n){var r=t.deps;if(r!==null)for(var e=n;e<r.length;e++)On(t,r[e])}function W(t){var n=t.f;if(!(n&b)){A(t,h);var r=a,e=i;a=t;try{n&st?yn(t):Nt(t),Ct(t),Rt(t);var s=Ht(t);t.teardown=typeof s=="function"?s:null,t.version=Lt}catch(l){J(l,t,r,e||t.ctx)}finally{a=r}}}function Yt(){if(k>1e3){k=0;try{rn()}catch(t){if(q!==null)J(t,q,null);else throw t}}k++}function jt(t){var n=t.length;if(n!==0){Yt();var r=N;N=!0;try{for(var e=0;e<n;e++){var s=t[e];s.f&h||(s.f^=h);var l=[];Bt(s,l),Rn(l)}}finally{N=r}}}function Rn(t){var n=t.length;if(n!==0)for(var r=0;r<n;r++){var e=t[r];if(!(e.f&(b|F)))try{B(e)&&(W(e),e.deps===null&&e.first===null&&e.nodes_start===null&&(e.teardown===null?kt(e):e.fn=null))}catch(s){J(s,e,null,e.ctx)}}}function Cn(){if(L=!1,k>1001)return;const t=S;S=[],jt(t),L||(k=0,q=null)}function X(t){V===Pt&&(L||(L=!0,queueMicrotask(Cn))),q=t;for(var n=t;n.parent!==null;){n=n.parent;var r=n.f;if(r&(z|T)){if(!(r&h))return;n.f^=h}}S.push(n)}function Bt(t,n){var r=t.first,e=[];t:for(;r!==null;){var s=r.f,l=(s&T)!==0,o=l&&(s&h)!==0,c=r.next;if(!o&&!(s&F))if(s&Y){if(l)r.f^=h;else try{B(r)&&W(r)}catch(_){J(_,r,null,r.ctx)}var p=r.first;if(p!==null){r=p;continue}}else s&pt&&e.push(r);if(c===null){let _=r.parent;for(;_!==null;){if(t===_)break t;var d=_.next;if(d!==null){r=d;continue t}_=_.parent}}r=c}for(var f=0;f<e.length;f++)p=e[f],n.push(p),Bt(p,n)}function Ut(t){var n=V,r=S;try{Yt();const s=[];V=An,S=s,L=!1,jt(r);var e=t==null?void 0:t();return Tn(),(S.length>0||s.length>0)&&Ut(),k=0,q=null,e}finally{V=n,S=r}}async function Or(){await Promise.resolve(),Ut()}function Rr(t){var f;var n=t.f,r=(n&y)!==0;if(r&&n&b){var e=St(t);return lt(t),e}if(u!==null){m!==null&&m.includes(t)&&en();var s=u.deps;v===null&&s!==null&&s[E]===t?E++:v===null?v=[t]:v.push(t),g!==null&&a!==null&&a.f&h&&!(a.f&T)&&g.includes(t)&&(A(a,x),X(a))}else if(r&&t.deps===null)for(var l=t,o=l.parent,c=l;o!==null;)if(o.f&y){var p=o;c=p,o=p.parent}else{var d=o;(f=d.deriveds)!=null&&f.includes(c)||(d.deriveds??(d.deriveds=[])).push(c);break}return r&&(l=t,B(l)&&It(l)),t.v}function Vt(t){const n=u;try{return u=null,t()}finally{u=n}}const Nn=~(x|j|h);function A(t,n){t.f=t.f&Nn|n}function Cr(t){return Gt().get(t)}function Nr(t,n){return Gt().set(t,n),n}function Gt(t){return i===null&&ot(),i.c??(i.c=new Map(kn(i)||void 0))}function kn(t){let n=t.p;for(;n!==null;){const r=n.c;if(r!==null)return r;n=n.p}return null}function kr(t,n=!1,r){i={p:i,c:null,e:null,m:!1,s:t,x:null,l:null}}function Fr(t){const n=i;if(n!==null){const o=n.e;if(o!==null){var r=a,e=u;n.e=null;try{for(var s=0;s<o.length;s++){var l=o[s];Z(l.effect),$(l.reaction),Ot(l.fn)}}finally{Z(r),$(e)}}i=n.p,n.m=!0}return{}}function br(t){if(!(typeof t!="object"||!t||t instanceof EventTarget)){if(ft in t)et(t);else if(!Array.isArray(t))for(let n in t){const r=t[n];typeof r=="object"&&r&&ft in r&&et(r)}}}function et(t,n=new Set){if(typeof t=="object"&&t!==null&&!(t instanceof EventTarget)&&!n.has(t)){n.add(t),t instanceof Date&&t.getTime();for(let e in t)try{et(t[e],n)}catch{}const r=$t(t);if(r!==Object.prototype&&r!==Array.prototype&&r!==Map.prototype&&r!==Set.prototype&&r!==Date.prototype){const e=Kt(r);for(let s in e){const l=e[s].get;if(l)try{l.call(t)}catch{}}}}}function Fn(t){i===null&&ot(),hn(()=>{const n=Vt(t);if(typeof n=="function")return n})}function Mr(t){i===null&&ot(),Fn(()=>()=>Vt(t))}export{cn as $,_r as A,pr as B,P as C,fr as D,ht as E,Ir as F,Sr as G,an as H,wn as I,w as J,Yn as K,Tr as L,ur as M,Vn as N,Xt as O,Qn as P,T as Q,z as R,ft as S,Z as T,lr as U,Xn as V,ln as W,tr as X,jn as Y,nr as Z,Hn as _,kr as a,O as a0,nt as a1,tt as a2,or as a3,Ut as a4,Pn as a5,Ar as a6,hn as a7,Fn as a8,Or as a9,mn as aA,Jn as aB,Wn as aC,Bn as aD,Kt as aE,Nr as aF,Cr as aG,br as aH,Wt as aI,Mr as aJ,_t as aK,ar as aa,st as ab,zt as ac,rr as ad,$ as ae,u as af,Jt as ag,on as ah,C as ai,er as aj,sr as ak,hr as al,yt as am,un as an,Tt as ao,Un as ap,wr as aq,Mn as ar,gr as as,i as at,zn as au,F as av,$n as aw,_n as ax,Zn as ay,Ft as az,cr as b,dr as c,mr as d,Ot as e,Er as f,Rr as g,qn as h,wt as i,Gn as j,ir as k,it as l,a as m,vr as n,Ln as o,Fr as p,Dr as q,dn as r,yr as s,xr as t,Vt as u,Kn as v,$t as w,bn as x,En as y,D as z};
