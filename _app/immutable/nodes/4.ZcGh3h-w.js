import{c as a,s as r,a as c,t as m,r as e,b as W,v as T,f as U,h as V,$ as X,d as Y,e as Z}from"../chunks/disclose-version.VlcF2N1U.js";import{p as N,a as O,t as d,g as s,d as G}from"../chunks/runtime.NqF6ywm4.js";import{P as ee,a as ae,B as se}from"../chunks/Page_Header.CGDX8AQL.js";import{i as K}from"../chunks/props.dsyMs83D.js";import{b as H,c as z,t as B,h as te,e as re,i as oe,m as ne,g as le}from"../chunks/repo.D9KUsRR3.js";import{b as ve}from"../chunks/entry.BqblJyQI.js";import{s as ie,a as de,p as ce}from"../chunks/stores.Cx--q540.js";var _e=m('<li role="none"><a> </a></li>'),ue=m('<nav class="modules_nav svelte-cbzlo7"><h6 class="svelte-cbzlo7">packages</h6> <ul class="unstyled"></ul></nav>');function pe(k,t){N(t,!0);const u=ie(),_=()=>de(ce,"$page",u);var h=ue(),g=a(h),w=r(r(g,!0));H(w,20,()=>t.repos_modules,(x,f)=>x,(x,f,l)=>{var o=_e(),n=a(o),p=a(n);e(n),e(o),d(()=>{z(n,"href",`#${f.repo.name??""}`),B(n,"selected",f.repo.name===_().url.hash),W(p,f.repo.name)}),c(x,o)}),e(w),e(h),c(k,h),O()}var me=m('<div class="chip row"><a> </a></div>'),he=m('<span class="chip"> </span>'),ge=m("<li> </li>"),fe=m('<li class="module svelte-1g4kqo1"><div class="module_file svelte-1g4kqo1"><!></div> <ul class="declarations unstyled svelte-1g4kqo1"></ul></li>'),xe=m('<li class="repo_module svelte-1g4kqo1"><header class="w_100 relative svelte-1g4kqo1"><a class="subtitle svelte-1g4kqo1">🔗</a> <a> </a></header> <ul class="modules panel unstyled svelte-1g4kqo1"></ul></li>'),be=m('<div class="modules_detail svelte-1g4kqo1"><div class="nav_wrapper svelte-1g4kqo1"><section><!></section> <!></div> <ul class="width_md box unstyled"></ul></div>');function ke(k,t){N(t,!0);const u=G(()=>t.repos.reduce((l,o)=>{var v,$;const{package_json:n,src_json:p}=o;return!p.modules||!((v=n.devDependencies)!=null&&v["@sveltejs/package"]||($=n.dependencies)!=null&&$["@sveltejs/package"])||l.push({repo:o,modules:Object.values(p.modules)}),l},[]));var _=be(),h=a(_),g=a(h),w=a(g);pe(w,{get repos_modules(){return s(u)}}),e(g);var x=r(r(g,!0));K(x,()=>t.nav_footer,l=>{var o=T(),n=U(o);te(n,()=>t.nav_footer),c(l,o)}),e(h);var f=r(r(h,!0));H(f,20,()=>s(u),(l,o)=>l,(l,o,n)=>{var p=xe();const v=G(()=>{const{repo:M,modules:D}=o;return{repo:M,modules:D}});var $=a(p),y=a($),A=r(r(y,!0)),L=a(A);e(A),e($);var I=r(r($,!0));H(I,20,()=>s(v).modules,(M,D)=>M,(M,D,we)=>{var j=fe();const b=G(()=>{const{path:q,declarations:i}=D;return{path:q,declarations:i}});d(()=>B(j,"ts",s(b).path.endsWith(".ts"))),d(()=>B(j,"svelte",s(b).path.endsWith(".svelte"))),d(()=>B(j,"css",s(b).path.endsWith(".css"))),d(()=>B(j,"json",s(b).path.endsWith(".json")));var C=a(j),Q=a(C);K(Q,()=>s(v).repo.repo_url,q=>{var i=me(),P=a(i);d(()=>z(P,"href",`${re(s(v).repo.repo_url,"/")??""}blob/main/src/lib/${s(b).path??""}`));var E=a(P);e(P),e(i),d(()=>W(E,s(b).path)),c(q,i)},q=>{var i=he(),P=a(i);e(i),d(()=>W(P,s(b).path)),c(q,i)}),e(C);var J=r(r(C,!0));H(J,21,()=>s(b).declarations,oe,(q,i,P)=>{let E=()=>s(i).name,R=()=>s(i).kind;var F=ge(),S=a(F);e(F),d(()=>{ne(F,`declaration chip ${R()??""}_declaration svelte-1g4kqo1`),W(S,E())}),c(q,F)}),e(J),e(j),c(M,j)}),e(I),e(p),d(()=>{z(y,"href",`#${s(v).repo.name??""}`),z(y,"id",s(v).repo.name),z(A,"href",`${ve??""}/tree/${s(v).repo.repo_name??""}`),W(L,s(v).repo.name)}),c(l,p)}),e(f),e(_),c(k,_),O()}var $e=m('<nav class="row"><!></nav>'),je=m('<main class="box w_100"><div class="p_lg"><!></div> <section class="svelte-pn9fea"><!></section> <section class="box mb_xl7 svelte-pn9fea"><!></section></main>');function qe(k,t){N(t,!0);var u=je();V(l=>{d(()=>X.title=`modules ${t.repo.package_json.glyph??""} ${t.repo.package_json.name??""}`)});var _=a(u),h=a(_);ee(h,{get pkg(){return t.repo}}),e(_);var g=r(r(_,!0)),w=a(g);ke(w,{get repos(){return t.repos},nav_footer:o=>{var n=$e(),p=a(n);se(p,{children:(v,$)=>{Y();var y=Z();d(()=>W(y,t.repo.package_json.glyph)),c(v,y)},$$slots:{default:!0}}),e(n),c(o,n)}}),e(g);var x=r(r(g,!0)),f=a(x);ae(f,{}),e(x),e(u),c(k,u),O()}function Fe(k,t){N(t,!0);const{repo:u,repos:_}=le();qe(k,{repo:u,repos:_}),O()}export{Fe as component};