import{a0 as H,a6 as $,z as q,q as U,a3 as b,A as Y,ad as j,B as _,ae as V,af as k,F as E,E as N,K as d,a2 as w,w as O,ag as z,ah as G,C as P,ai as I,aj as S,ak as K,al as x,am as J,an as Q,ao as X,ap as Z,I as ee,p as te,a as re,d as ae}from"./runtime.CIdLDIsX.js";const W=new Set,R=new Set;function ne(e,t,a,o){function n(r){if(o.capture||T.call(t,r),!r.cancelBubble)return a.call(this,r)}return e.startsWith("pointer")||e.startsWith("touch")||e==="wheel"?U(()=>{t.addEventListener(e,n,o)}):t.addEventListener(e,n,o),n}function _e(e,t,a,o,n){var r={capture:o,passive:n},i=ne(e,t,a,r);(t===document.body||t===window||t===document)&&H(()=>{t.removeEventListener(e,i,r)})}function he(e){for(var t=0;t<e.length;t++)W.add(e[t]);for(var a of R)a(e)}function T(e){var C;var t=this,a=t.ownerDocument,o=e.type,n=((C=e.composedPath)==null?void 0:C.call(e))||[],r=n[0]||e.target,i=0,h=e.__root;if(h){var l=n.indexOf(h);if(l!==-1&&(t===document||t===window)){e.__root=t;return}var v=n.indexOf(t);if(v===-1)return;l<=v&&(i=l)}if(r=n[i]||e.target,r!==t){$(e,"currentTarget",{configurable:!0,get(){return r||a}});try{for(var y,c=[];r!==null;){var u=r.assignedSlot||r.parentNode||r.host||null;try{var s=r["__"+o];if(s!==void 0&&!r.disabled)if(q(s)){var[m,...A]=s;m.apply(r,[e,...A])}else s.call(r,e)}catch(L){y?c.push(L):y=L}if(e.cancelBubble||u===t||u===null)break;r=u}if(y){for(let L of c)queueMicrotask(()=>{throw L});throw y}}finally{e.__root=t,delete e.currentTarget}}}let f;function oe(){f=void 0}function pe(e){let t=null,a=_;var o;if(_){for(t=d,f===void 0&&(f=w(document.head));f!==null&&(f.nodeType!==8||f.data!==V);)f=k(f);f===null?E(!1):f=N(k(f))}_||(o=document.head.appendChild(b()));try{Y(()=>e(o),j)}finally{a&&(E(!0),f=d,N(t))}}function B(e){var t=document.createElement("template");return t.innerHTML=e,t.content}function p(e,t){var a=O;a.nodes_start===null&&(a.nodes_start=e,a.nodes_end=t)}function ve(e,t){var a=(t&z)!==0,o=(t&G)!==0,n,r=!e.startsWith("<!>");return()=>{if(_)return p(d,null),d;n===void 0&&(n=B(r?e:"<!>"+e),a||(n=w(n)));var i=o?document.importNode(n,!0):n.cloneNode(!0);if(a){var h=w(i),l=i.lastChild;p(h,l)}else p(i,i);return i}}function me(e,t,a="svg"){var o=!e.startsWith("<!>"),n=`<${a}>${o?e:"<!>"+e}</${a}>`,r;return()=>{if(_)return p(d,null),d;if(!r){var i=B(n),h=w(i);r=w(h)}var l=r.cloneNode(!0);return p(l,l),l}}function ye(e=""){if(!_){var t=b(e+"");return p(t,t),t}var a=d;return a.nodeType!==3&&(a.before(a=b()),N(a)),p(a,a),a}function ge(){if(_)return p(d,null),d;var e=document.createDocumentFragment(),t=document.createComment(""),a=b();return e.append(t,a),p(t,a),e}function Ee(e,t){if(_){O.nodes_end=d,P();return}e!==null&&e.before(t)}function we(e){return e.endsWith("capture")&&e!=="gotpointercapture"&&e!=="lostpointercapture"}const ie=["beforeinput","click","change","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"];function Te(e){return ie.includes(e)}const se={formnovalidate:"formNoValidate",ismap:"isMap",nomodule:"noModule",playsinline:"playsInline",readonly:"readOnly"};function be(e){return e=e.toLowerCase(),se[e]??e}const ue=["touchstart","touchmove"];function de(e){return ue.includes(e)}let D=!0;function Ne(e){D=e}function Ae(e,t){t!==(e.__t??(e.__t=e.nodeValue))&&(e.__t=t,e.nodeValue=t==null?"":t+"")}function le(e,t){return F(e,t)}function Le(e,t){I(),t.intro=t.intro??!1;const a=t.target,o=_,n=d;try{for(var r=w(a);r&&(r.nodeType!==8||r.data!==V);)r=k(r);if(!r)throw S;E(!0),N(r),P();const i=F(e,{...t,anchor:r});if(d===null||d.nodeType!==8||d.data!==K)throw x(),S;return E(!1),i}catch(i){if(i===S)return t.recover===!1&&J(),I(),Q(a),E(!1),le(e,t);throw i}finally{E(o),N(n),oe()}}const g=new Map;function F(e,{target:t,anchor:a,props:o={},events:n,context:r,intro:i=!0}){I();var h=new Set,l=c=>{for(var u=0;u<c.length;u++){var s=c[u];if(!h.has(s)){h.add(s);var m=de(s);t.addEventListener(s,T,{passive:m});var A=g.get(s);A===void 0?(document.addEventListener(s,T,{passive:m}),g.set(s,1)):g.set(s,A+1)}}};l(X(W)),R.add(l);var v=void 0,y=Z(()=>{var c=a??t.appendChild(b());return ee(()=>{if(r){te({});var u=ae;u.c=r}n&&(o.$$events=n),_&&p(c,null),D=i,v=e(c,o)||{},D=!0,_&&(O.nodes_end=d),r&&re()}),()=>{var m;for(var u of h){t.removeEventListener(u,T);var s=g.get(u);--s===0?(document.removeEventListener(u,T),g.delete(u)):g.set(u,s)}R.delete(l),M.delete(v),c!==a&&((m=c.parentNode)==null||m.removeChild(c))}});return M.set(v,y),v}let M=new WeakMap;function Se(e){const t=M.get(e);t&&t()}const fe="5";typeof window<"u"&&(window.__svelte||(window.__svelte={v:new Set})).v.add(fe);export{Ee as a,ye as b,ge as c,Ne as d,p as e,Le as f,D as g,pe as h,B as i,we as j,ne as k,he as l,le as m,me as n,be as o,Te as p,_e as q,Ae as s,ve as t,Se as u};
