import{a5 as Y,q as z,ab as G,ai as S,T as k,z as J,_ as W,w as N,a8 as b,A as K,aj as x,E as _,ak as q,al as I,K as E,J as L,L as u,a7 as w,am as Q,an as X,F,ao as M,ap as D,aq as Z,ar as ee,as as te,at as re,au as ae,av as ne,C as oe,p as ie,a as se,d as ue}from"./runtime.mAOCZyco.js";const H=new Set,O=new Set;function de(e,t,r,i){function n(a){if(i.capture||T.call(t,a),!a.cancelBubble){var o=W,f=N;S(null),k(null);try{return r.call(this,a)}finally{S(o),k(f)}}}return e.startsWith("pointer")||e.startsWith("touch")||e==="wheel"?z(()=>{t.addEventListener(e,n,i)}):t.addEventListener(e,n,i),n}function ye(e,t,r,i,n){var a={capture:i,passive:n},o=de(e,t,r,a);(t===document.body||t===window||t===document)&&Y(()=>{t.removeEventListener(e,o,a)})}function ge(e){for(var t=0;t<e.length;t++)H.add(e[t]);for(var r of O)r(e)}function T(e){var P;var t=this,r=t.ownerDocument,i=e.type,n=((P=e.composedPath)==null?void 0:P.call(e))||[],a=n[0]||e.target,o=0,f=e.__root;if(f){var l=n.indexOf(f);if(l!==-1&&(t===document||t===window)){e.__root=t;return}var m=n.indexOf(t);if(m===-1)return;l<=m&&(o=l)}if(a=n[o]||e.target,a!==t){G(e,"currentTarget",{configurable:!0,get(){return a||r}});var R=W,p=N;S(null),k(null);try{for(var s,d=[];a!==null;){var v=a.assignedSlot||a.parentNode||a.host||null;try{var y=a["__"+i];if(y!==void 0&&!a.disabled)if(J(y)){var[j,...U]=y;j.apply(a,[e,...U])}else y.call(a,e)}catch(A){s?d.push(A):s=A}if(e.cancelBubble||v===t||v===null)break;a=v}if(s){for(let A of d)queueMicrotask(()=>{throw A});throw s}}finally{e.__root=t,delete e.currentTarget,S(R),k(p)}}}let c;function le(){c=void 0}function Ee(e){let t=null,r=_;var i;if(_){for(t=u,c===void 0&&(c=w(document.head));c!==null&&(c.nodeType!==8||c.data!==q);)c=I(c);c===null?E(!1):c=L(I(c))}_||(i=document.head.appendChild(b()));try{K(()=>e(i),x)}finally{r&&(E(!0),c=u,L(t))}}function $(e){var t=document.createElement("template");return t.innerHTML=e,t.content}function h(e,t){var r=N;r.nodes_start===null&&(r.nodes_start=e,r.nodes_end=t)}function we(e,t){var r=(t&Q)!==0,i=(t&X)!==0,n,a=!e.startsWith("<!>");return()=>{if(_)return h(u,null),u;n===void 0&&(n=$(a?e:"<!>"+e),r||(n=w(n)));var o=i?document.importNode(n,!0):n.cloneNode(!0);if(r){var f=w(o),l=o.lastChild;h(f,l)}else h(o,o);return o}}function Te(e,t,r="svg"){var i=!e.startsWith("<!>"),n=`<${r}>${i?e:"<!>"+e}</${r}>`,a;return()=>{if(_)return h(u,null),u;if(!a){var o=$(n),f=w(o);a=w(f)}var l=a.cloneNode(!0);return h(l,l),l}}function be(e=""){if(!_){var t=b(e+"");return h(t,t),t}var r=u;return r.nodeType!==3&&(r.before(r=b()),L(r)),h(r,r),r}function Le(){if(_)return h(u,null),u;var e=document.createDocumentFragment(),t=document.createComment(""),r=b();return e.append(t,r),h(t,r),e}function Ne(e,t){if(_){N.nodes_end=u,F();return}e!==null&&e.before(t)}function Ae(e){return e.endsWith("capture")&&e!=="gotpointercapture"&&e!=="lostpointercapture"}const fe=["beforeinput","click","change","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"];function Se(e){return fe.includes(e)}const ce={formnovalidate:"formNoValidate",ismap:"isMap",nomodule:"noModule",playsinline:"playsInline",readonly:"readOnly"};function ke(e){return e=e.toLowerCase(),ce[e]??e}const _e=["touchstart","touchmove"];function pe(e){return _e.includes(e)}let C=!0;function Re(e){C=e}function De(e,t){var r=t==null?"":typeof t=="object"?t+"":t;r!==(e.__t??(e.__t=e.nodeValue))&&(e.__t=r,e.nodeValue=r==null?"":r+"")}function he(e,t){return B(e,t)}function Ie(e,t){M(),t.intro=t.intro??!1;const r=t.target,i=_,n=u;try{for(var a=w(r);a&&(a.nodeType!==8||a.data!==q);)a=I(a);if(!a)throw D;E(!0),L(a),F();const o=B(e,{...t,anchor:a});if(u===null||u.nodeType!==8||u.data!==Z)throw ee(),D;return E(!1),o}catch(o){if(o===D)return t.recover===!1&&te(),M(),re(r),E(!1),he(e,t);throw o}finally{E(i),L(n),le()}}const g=new Map;function B(e,{target:t,anchor:r,props:i={},events:n,context:a,intro:o=!0}){M();var f=new Set,l=p=>{for(var s=0;s<p.length;s++){var d=p[s];if(!f.has(d)){f.add(d);var v=pe(d);t.addEventListener(d,T,{passive:v});var y=g.get(d);y===void 0?(document.addEventListener(d,T,{passive:v}),g.set(d,1)):g.set(d,y+1)}}};l(ae(H)),O.add(l);var m=void 0,R=ne(()=>{var p=r??t.appendChild(b());return oe(()=>{if(a){ie({});var s=ue;s.c=a}n&&(i.$$events=n),_&&h(p,null),C=o,m=e(p,i)||{},C=!0,_&&(N.nodes_end=u),a&&se()}),()=>{var v;for(var s of f){t.removeEventListener(s,T);var d=g.get(s);--d===0?(document.removeEventListener(s,T),g.delete(s)):g.set(s,d)}O.delete(l),V.delete(m),p!==r&&((v=p.parentNode)==null||v.removeChild(p))}});return V.set(m,R),m}let V=new WeakMap;function Me(e){const t=V.get(e);t&&t()}const ve="5";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(ve);export{Ne as a,be as b,Le as c,h as d,Re as e,Ie as f,C as g,Ee as h,$ as i,Ae as j,de as k,ge as l,he as m,Te as n,ke as o,Se as p,ye as q,De as s,we as t,Me as u};
