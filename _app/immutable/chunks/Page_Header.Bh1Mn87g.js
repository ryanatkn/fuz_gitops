import{b as H,a as t,c as B,t as u,s as A}from"./disclose-version.DR9XeTAQ.js";import{p as C,f as F,t as b,a as D,c as h,r as f,s as J,v as e,Y as k,n as K,a4 as Q}from"./runtime.mAOCZyco.js";import{L as R}from"./Library_Footer.C1KD3aeB.js";import{f as Y,a as S,i as T,s as E,t as G,e as U,h as V,r as W,g as I}from"./repo.CUqVuaeY.js";import{i as L}from"./props.DnBL7JYR.js";import{s as X,a as Z,p as $}from"./stores.By1Bs3XP.js";import{b as aa}from"./entry.D8nrPGIm.js";const ea=l=>l.split("/").filter(a=>a&&a!=="."&&a!==".."),ta=l=>{const a=[],s=ea(l);s.length&&a.push({type:"separator",path:"/"});let o="";for(let r=0;r<s.length;r++){const c=s[r];o+="/"+c,a.push({type:"piece",name:c,path:o}),r!==s.length-1&&a.push({type:"separator",path:o})}return a};var sa=u('<a class="svelte-c9k2g"> </a>'),ra=u('<span class="separator svelte-c9k2g"><!></span>'),na=u('<div class="breadcrumb svelte-c9k2g"><a class="svelte-c9k2g"><!></a><!></div>');function M(l,a){C(a,!0);const s=X(),o=()=>Z($,"$page",s),r=k(()=>a.base_path??aa),c=k(()=>a.path??V(o().url.pathname,e(r))),g=k(()=>a.selected_path===null?null:a.selected_path??e(c)),n=k(()=>ta(e(c))),v=k(()=>U(e(r),"/"));var m=na(),d=h(m),x=h(d);L(x,()=>a.children,p=>{var _=B(),P=F(_);Y(P,()=>a.children),t(p,_)},p=>{var _=H("•");t(p,_)}),f(d);var y=J(d);S(y,17,()=>e(n),T,(p,_)=>{var P=B(),N=F(P);L(N,()=>e(_).type==="piece",q=>{var i=sa(),w=h(i);f(i),b(()=>{E(i,"href",e(r)+e(_).path),G(i,"selected",e(_).path===e(g)),A(w,e(_).name)}),t(q,i)},q=>{var i=ra(),w=h(i);L(w,()=>a.separator,z=>{var j=B(),O=F(j);Y(O,()=>a.separator),t(z,j)},z=>{var j=H("/");t(z,j)}),f(i),t(q,i)}),t(p,P)}),f(m),b(()=>{E(d,"href",e(v)),G(d,"selected",e(v)===e(r)+e(g))}),t(l,m),D()}var oa=u('<nav class="mb_xl5"><!></nav>'),la=u('<section class="box mb_xl7"><!></section>');function ma(l,a){C(a,!0);const{repo:s}=W.get();var o=la(),r=h(o);R(r,{pkg:s,children:(c,g)=>{var n=oa(),v=h(n);M(v,{children:(m,d)=>{K();var x=H();b(()=>A(x,s.package_json.glyph)),t(m,x)},$$slots:{default:!0}}),f(n),t(c,n)},$$slots:{default:!0}}),f(o),t(l,o),D()}var ca=u("<nav><!></nav>"),va=u("<header><!> <!></header>");function ua(l,a){C(a,!0);var s=va();let o;var r=h(s);Y(r,()=>a.children??Q);var c=J(r,2);L(c,()=>a.nav,g=>{var n=B(),v=F(n);Y(v,()=>a.nav),t(g,n)},g=>{var n=ca();let v;var m=h(n);M(m,{children:(d,x)=>{K();var y=H();b(()=>{var p;return A(y,(p=a.pkg.package_json)==null?void 0:p.glyph)}),t(d,y)},$$slots:{default:!0}}),f(n),b(()=>v=I(n,v,{...a.nav_attrs},"svelte-1flr0dx")),t(g,n)}),f(s),b(()=>o=I(s,o,{...a.attrs},"svelte-1flr0dx")),t(l,s),D()}export{M as B,ua as P,ma as a};
