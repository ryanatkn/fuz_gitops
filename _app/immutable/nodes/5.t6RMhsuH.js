import{c as t,s,a as u,t as P,r as e,e as G,b as m,h as I,$ as J}from"../chunks/disclose-version.VlcF2N1U.js";import{p as q,a as j,g as r,d as K,t as y}from"../chunks/runtime.NqF6ywm4.js";import{P as L,a as M}from"../chunks/Page_Header.CGDX8AQL.js";import{i as N}from"../chunks/props.dsyMs83D.js";import{b as O,i as Q,c as x,g as S}from"../chunks/repo.D9KUsRR3.js";import{b as T}from"../chunks/entry.BqblJyQI.js";import{t as U}from"../chunks/github_helpers.wFZESeOv.js";var V=P('<tr><td class="svelte-xslkkk"><a> <!></a></td><td class="svelte-xslkkk"><a> </a></td><td class="svelte-xslkkk"><div> </div></td></tr>'),W=P('<div class="width_md"><section class="panel p_sm svelte-xslkkk"><table><thead><tr><th class="svelte-xslkkk">repo</th><th class="svelte-xslkkk">number</th><th class="svelte-xslkkk">title</th></tr></thead><tbody></tbody></table></section></div>');function X(_,a){q(a,!0);const i=K(()=>U(a.repos,a.filter_pull_request));var o=W(),n=t(o),v=t(n),d=t(v),c=t(d),k=t(c),w=s(k);s(w),e(c),e(d);var R=s(d);O(R,21,()=>r(i),Q,(z,l,ee)=>{var h=V(),g=t(h),f=t(g),$=t(f),A=s($);N(A,()=>r(l).repo.package_json.glyph,E=>{var H=G();y(()=>m(H,` ${r(l).repo.package_json.glyph??""}`)),u(E,H)}),e(f),e(g);var b=s(g),p=t(b),B=t(p);e(p),e(b);var D=s(b),F=t(D),C=t(F);e(F),e(D),e(h),y(()=>{x(f,"href",`${T??""}/tree/${r(l).repo.repo_name??""}`),m($,r(l).repo.repo_name),x(p,"href",`${r(l).repo.repo_url??""}/pull/${r(l).pull_request.number??""}`),x(p,"title",r(l).pull_request.title),m(B,`#${r(l).pull_request.number??""}`),m(C,r(l).pull_request.title)}),u(z,h)}),e(R),e(v),e(n),e(o),u(_,o),j()}var Y=P('<main class="box w_100"><div class="p_lg"><!></div> <section class="svelte-pn9fea"><!></section> <section class="box mb_xl7 svelte-pn9fea"><!></section></main>');function Z(_,a){q(a,!0);var i=Y();I(w=>{y(()=>J.title=`pull requests ${a.repo.package_json.glyph??""} ${a.repo.package_json.name??""}`)});var o=t(i),n=t(o);L(n,{get pkg(){return a.repo}}),e(o);var v=s(s(o,!0)),d=t(v);X(d,{get repos(){return a.repos},get filter_pull_request(){return a.filter_pull_request}}),e(v);var c=s(s(v,!0)),k=t(c);M(k,{}),e(c),e(i),u(_,i),j()}function ne(_,a){q(a,!0);const{repo:i,repos:o}=S();Z(_,{repo:i,repos:o,filter_pull_request:n=>n.user.login==="ryanatkn"}),j()}export{ne as component};
