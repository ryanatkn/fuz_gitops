import{s as ie,a as l,t as d,b as x,d as ae,f as ue,c as pe,h as me}from"../chunks/disclose-version.CfCOlRmB.js";import{p as O,a as Q,c as s,s as g,n as ge,r as t,t as c,v as e,f as te,Y as k,$ as he}from"../chunks/runtime.BbCTRcoN.js";import{P as fe,a as qe}from"../chunks/Page_Header.C_2nmzol.js";import{p as xe,i as b}from"../chunks/props.BxePt3wi.js";import{a as Y,i as ke,s as m,t as se,b as N,r as be}from"../chunks/repo.DgDD5bG1.js";import{p as je}from"../chunks/stores.BbimB5LV.js";import{b as ye}from"../chunks/entry.Dpw4RbfB.js";import{f as re}from"../chunks/Library_Footer.kZJkl-Z5.js";import{a as we}from"../chunks/github_helpers.DFkyRKIC.js";var Pe=d('<th class="svelte-1v5q9eq"> </th>'),De=d("<a> </a>"),Te=d('<a class="row"><img> </a>'),$e=d("<a><!></a>"),ze=d("<a> </a>  <!>",1),Ce=d("<a> </a>"),Fe=d('<div class="row"><a><code> </code></a></div>'),He=d("<a> </a>"),Ie=d('<td class="svelte-1v5q9eq"><div class="svelte-1v5q9eq"> </div></td>'),Me=d('<a class="chip"> </a>'),Re=d('<div class="row"><!></div>'),Ye=d('<tr class="svelte-1v5q9eq"><td class="svelte-1v5q9eq"><div class="row"><!></div></td><td class="svelte-1v5q9eq"><div class="row"><!></div></td><td class="svelte-1v5q9eq"><div class="row"><!></div></td><td class="svelte-1v5q9eq"><!></td><td class="svelte-1v5q9eq"><!></td><!><td class="svelte-1v5q9eq"><!></td></tr>'),Ae=d('<table><thead><tr class="svelte-1v5q9eq"><th class="svelte-1v5q9eq">tree</th><th class="svelte-1v5q9eq">homepage</th><th class="svelte-1v5q9eq">repo</th><th class="svelte-1v5q9eq">npm</th><th class="svelte-1v5q9eq">version</th><!><th class="svelte-1v5q9eq">pull requests</th></tr></thead><tbody></tbody></table>');function Be(T,i){O(i,!0);const y=ie(),w=()=>pe(je,"$page",y),$=xe(i,"deps",19,()=>["@ryanatkn/fuz","@ryanatkn/gro"]),z=(v,r)=>{for(const n in v.package_json.dependencies)if(n===r)return v.package_json.dependencies[n];for(const n in v.package_json.devDependencies)if(n===r)return v.package_json.devDependencies[n];return null},H=k(()=>new Map($().map(v=>{const r=i.repos.find(n=>n.package_json.name===v);return r!=null&&r.package_json?[v,r.package_json.version]:[v,null]}))),I=v=>v===null?"":v.replace(/^(\^|>=)\s*/,""),M=(v,r)=>{const n=v==null?void 0:v.find(F=>F.repo_url===r.repo_url);if(!(n!=null&&n.package_json))return null;const{pull_requests:u}=n;return u};var C=Ae(),R=s(C),S=s(R),oe=g(s(S),5);Y(oe,16,$,v=>v,(v,r)=>{var n=Pe(),u=s(n,!0);t(n),c(()=>x(u,r)),l(v,n)}),ge(),t(S),t(R);var U=g(R);Y(U,21,()=>i.repos,ke,(v,r)=>{var n=Ye();const u=k(()=>{const{package_json:_,homepage_url:a}=e(r);return{package_json:_,homepage_url:a}});var F=s(n),V=s(F),ve=s(V);b(ve,()=>e(u).package_json,_=>{var a=De(),o=s(a,!0);t(a),c(()=>{m(a,"href",`${ye??""}/tree/${e(r).repo_name??""}`),x(o,e(u).package_json.glyph??"🌳")}),l(_,a)}),t(V),t(F);var A=g(F),W=s(A),ne=s(W);b(ne,()=>e(u).homepage_url,_=>{var a=Te(),o=s(a),p=g(o);c(()=>x(p,` ${re(e(u).homepage_url)??""}`)),t(a),c(()=>{m(a,"href",e(u).homepage_url),se(a,"selected",e(u).homepage_url===w().url.href),m(o,"src",e(r).logo_url),m(o,"alt",e(r).logo_alt),N(o,"width","16px"),N(o,"height","16px"),N(o,"margin-right","var(--space_xs)")}),l(_,a)}),t(W),t(A);var B=g(A),X=s(B),_e=s(X);b(_e,()=>e(u).package_json,_=>{var a=ze();const o=k(()=>e(r).check_runs),p=k(()=>{var h;return((h=e(o))==null?void 0:h.status)==="completed"}),j=k(()=>{var h;return((h=e(o))==null?void 0:h.conclusion)==="success"});var q=te(a),P=s(q,!0);t(q);var D=g(q,2);b(D,()=>e(o)&&(!e(p)||!e(j)),h=>{var f=$e(),J=s(f);b(J,()=>!e(p),K=>{var L=ae("🟡");l(K,L)},K=>{var L=ae("⚠️");l(K,L)}),t(f),c(()=>{m(f,"href",`${e(r).repo_url??""}/commits/main`),m(f,"title",e(p)?`CI failed: ${e(o).conclusion}`:`status: ${e(o).status}`)}),l(h,f)}),c(()=>{m(q,"href",e(r).repo_url),x(P,e(r).repo_name)}),l(_,a)},_=>{var a=Ce(),o=s(a,!0);c(()=>x(o,re(e(r).repo_url))),t(a),c(()=>m(a,"href",e(r).repo_url)),l(_,a)}),t(X),t(B);var E=g(B),le=s(E);b(le,()=>e(r).npm_url,_=>{var a=Fe(),o=s(a),p=s(o),j=s(p,!0);t(p),t(o),t(a),c(()=>{m(o,"href",e(r).npm_url),x(j,e(r).name)}),l(_,a)}),t(E);var G=g(E),ce=s(G);b(ce,()=>e(u).package_json.version!=="0.0.1",_=>{var a=He(),o=s(a,!0);c(()=>x(o,I(e(u).package_json.version))),t(a),c(()=>m(a,"href",e(r).changelog_url)),l(_,a)}),t(G);var Z=g(G);Y(Z,16,$,_=>_,(_,a)=>{var o=Ie();const p=k(()=>z(e(r),a)),j=k(()=>I(e(p))),q=k(()=>e(H).get(a));var P=s(o),D=s(P,!0);t(P),t(o),c(()=>{se(P,"latest",!!e(q)&&e(j)===e(q)),x(D,e(j))}),l(_,o)});var ee=g(Z),de=s(ee);b(de,()=>e(r).repo_url,_=>{var a=Re();const o=k(()=>M(i.repos,e(r)));var p=s(a);b(p,()=>e(o),j=>{var q=ue(),P=te(q);Y(P,16,()=>e(o),D=>D,(D,h)=>{var f=Me();c(()=>m(f,"href",we(e(r).repo_url,h)));var J=s(f);t(f),c(()=>{m(f,"title",h.title),x(J,`#${h.number??""}`)}),l(D,f)}),l(j,q)}),t(a),l(_,a)}),t(ee),t(n),l(v,n)}),t(U),t(C),l(T,C),Q()}var Ee=d('<main class="box svelte-1v3x3ux"><div class="p_lg"><!></div> <section class="svelte-1v3x3ux"><div class="panel p_md"><!></div></section> <section class="box mb_xl7 svelte-1v3x3ux"><!></section></main>');function Ge(T,i){O(i,!0);var y=Ee();me(R=>{c(()=>he.title=`table ${i.repo.package_json.glyph??""} ${i.repo.package_json.name??""}`)});var w=s(y),$=s(w);fe($,{get pkg(){return i.repo}}),t(w);var z=g(w,2),H=s(z),I=s(H);Be(I,{get repos(){return i.repos}}),t(H),t(z);var M=g(z,2),C=s(M);qe(C,{}),t(M),t(y),l(T,y),Q()}function We(T,i){O(i,!0);const{repo:y,repos:w}=be.get();Ge(T,{repo:y,repos:w}),Q()}export{We as component};
