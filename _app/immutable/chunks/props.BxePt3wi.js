import{S as x,o as z,h as G,i as P,j as V,k as g,U as h,m as S,v as w,w as F,x as $,y as k,z as J,A as Q,B as C,C as Y,D as j,E as L,F as W,G as X,H as ee,I as re,J as te,K as q,L as ne,M as ae,N as ie,P as fe,O as se,u as M,Q as ue,R as le,T as U,V as ve,W as _e,X as de,Y as K,Z as oe,_ as ce,a0 as he,a1 as ye,a2 as be,a3 as A}from"./runtime.BbCTRcoN.js";import{e as ge}from"./disclose-version.CfCOlRmB.js";function I(t,f=null,s){if(typeof t!="object"||t===null||x in t)return t;const i=k(t);if(i!==z&&i!==G)return t;var n=new Map,v=J(t),c=P(0);v&&n.set("length",P(t.length));var o;return new Proxy(t,{defineProperty(u,e,r){(!("value"in r)||r.configurable===!1||r.enumerable===!1||r.writable===!1)&&V();var a=n.get(e);return a===void 0?(a=P(r.value),n.set(e,a)):g(a,I(r.value,o)),!0},deleteProperty(u,e){var r=n.get(e);if(r===void 0)e in u&&n.set(e,P(h));else{if(v&&typeof e=="string"){var a=n.get("length"),l=Number(e);Number.isInteger(l)&&l<a.v&&g(a,l)}g(r,h),H(c)}return!0},get(u,e,r){var y;if(e===x)return t;var a=n.get(e),l=e in u;if(a===void 0&&(!l||(y=S(u,e))!=null&&y.writable)&&(a=P(I(l?u[e]:h,o)),n.set(e,a)),a!==void 0){var _=w(a);return _===h?void 0:_}return Reflect.get(u,e,r)},getOwnPropertyDescriptor(u,e){var r=Reflect.getOwnPropertyDescriptor(u,e);if(r&&"value"in r){var a=n.get(e);a&&(r.value=w(a))}else if(r===void 0){var l=n.get(e),_=l==null?void 0:l.v;if(l!==void 0&&_!==h)return{enumerable:!0,configurable:!0,value:_,writable:!0}}return r},has(u,e){var _;if(e===x)return!0;var r=n.get(e),a=r!==void 0&&r.v!==h||Reflect.has(u,e);if(r!==void 0||F!==null&&(!a||(_=S(u,e))!=null&&_.writable)){r===void 0&&(r=P(a?I(u[e],o):h),n.set(e,r));var l=w(r);if(l===h)return!1}return a},set(u,e,r,a){var O;var l=n.get(e),_=e in u;if(v&&e==="length")for(var y=r;y<l.v;y+=1){var b=n.get(y+"");b!==void 0?g(b,h):y in u&&(b=P(h),n.set(y+"",b))}l===void 0?(!_||(O=S(u,e))!=null&&O.writable)&&(l=P(void 0),g(l,I(r,o)),n.set(e,l)):(_=l.v!==h,g(l,I(r,o)));var m=Reflect.getOwnPropertyDescriptor(u,e);if(m!=null&&m.set&&m.set.call(a,r),!_){if(v&&typeof e=="string"){var D=n.get("length"),E=Number(e);Number.isInteger(E)&&E>=D.v&&g(D,E+1)}H(c)}return!0},ownKeys(u){w(c);var e=Reflect.ownKeys(u).filter(l=>{var _=n.get(l);return _===void 0||_.v!==h});for(var[r,a]of n)a.v!==h&&!(r in u)&&e.push(r);return e},setPrototypeOf(){$()}})}function H(t,f=1){g(t,t.v+f)}function Ee(t,f,s,i=null,n=!1){L&&W();var v=t,c=null,o=null,u=null,e=n?X:0;Q(()=>{if(u===(u=!!f()))return;let r=!1;if(L){const a=v.data===ee;u===a&&(v=re(),te(v),q(!1),r=!0)}u?(c?C(c):c=Y(()=>s(v)),o&&j(o,()=>{o=null})):(o?C(o):i&&(o=Y(()=>i(v))),c&&j(c,()=>{c=null})),r&&q(!0)},e),L&&(v=ne)}const we={get(t,f){let s=t.props.length;for(;s--;){let i=t.props[s];if(A(i)&&(i=i()),typeof i=="object"&&i!==null&&f in i)return i[f]}},set(t,f,s){let i=t.props.length;for(;i--;){let n=t.props[i];A(n)&&(n=n());const v=S(n,f);if(v&&v.set)return v.set(s),!0}return!1},getOwnPropertyDescriptor(t,f){let s=t.props.length;for(;s--;){let i=t.props[s];if(A(i)&&(i=i()),typeof i=="object"&&i!==null&&f in i){const n=S(i,f);return n&&!n.configurable&&(n.configurable=!0),n}}},has(t,f){for(let s of t.props)if(A(s)&&(s=s()),s!=null&&f in s)return!0;return!1},ownKeys(t){const f=[];for(let s of t.props){A(s)&&(s=s());for(const i in s)f.includes(i)||f.push(i)}return f}};function Re(...t){return new Proxy({props:t},we)}function Z(t){for(var f=F,s=F;f!==null&&!(f.f&(ue|le));)f=f.parent;try{return U(f),t()}finally{U(s)}}function Ie(t,f,s,i){var B;var n=(s&ve)!==0,v=(s&_e)!==0,c=(s&de)!==0,o=(s&ye)!==0,u=!1,e;c?[e,u]=ge(()=>t[f]):e=t[f];var r=(B=S(t,f))==null?void 0:B.set,a=i,l=!0,_=!1,y=()=>(_=!0,l&&(l=!1,o?a=M(i):a=i),a);e===void 0&&i!==void 0&&(r&&v&&ae(),e=y(),r&&r(e));var b;if(v)b=()=>{var d=t[f];return d===void 0?y():(l=!0,_=!1,d)};else{var m=Z(()=>(n?K:oe)(()=>t[f]));m.f|=ie,b=()=>{var d=w(m);return d!==void 0&&(a=void 0),d===void 0?a:d}}if(!(s&fe))return b;if(r){var D=t.$$legacy;return function(d,R){return arguments.length>0?((!v||!R||D||u)&&r(R?b():d),d):b()}}var E=!1,O=!1,N=be(e),T=Z(()=>K(()=>{var d=b(),R=w(N),p=ce;return E||d===void 0&&p.f&he?(E=!1,O=!0,R):(O=!1,N.v=d)}));return n||(T.equals=se),function(d,R){if(arguments.length>0){const p=R?w(T):v&&c?I(d):d;return T.equals(p)||(E=!0,g(N,p),_&&a!==void 0&&(a=p),M(()=>w(T))),d}return w(T)}}export{I as a,Ee as i,Ie as p,Re as s};
