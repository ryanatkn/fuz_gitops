import{p as Q,d as M,b as q,c as C,r as U}from"../chunks/repo.rzq5l2oq.js";import{r as V}from"../chunks/repos.C095b6qO.js";import{c as D,a as n,t as _,b as G,s as F,h as W}from"../chunks/disclose-version.DpADMs6g.js";import{a as H,f as A,p as I,c as r,b as s,t as h,g as i,s as w,d as b,$ as X,n as Y}from"../chunks/index-client.DhdBEv7V.js";import{p as Z,i as O,s as $,a as ee}from"../chunks/props.BR1t6aRC.js";import{p as te}from"../chunks/stores.CYu-ZG7b.js";import{P as ae,a as oe,B as re}from"../chunks/Page_Header.Co45NMqO.js";import{R as se}from"../chunks/Repos_Tree.CbwGPqaT.js";const ne=Q(V,"https://gitops.fuz.dev/"),ie=()=>ne.repos.map(d=>({slug:d.repo_name})),Te=Object.freeze(Object.defineProperty({__proto__:null,entries:ie},Symbol.toStringTag,{value:"Module"})),E={inform:{color:"var(--text_color_3)",icon:"✻"},help:{color:"var(--color_b_5)",icon:"➺"},error:{color:"var(--color_c_5)",icon:"!?"}};var ce=_('<div class="icon svelte-tarwjh"><!></div>'),le=_('<!> <div class="content svelte-tarwjh"><!></div>',1),ve=_("<button><!></button>"),_e=_("<div><!></div>");function de(d,e){H(e,!0);const u=a=>{var t=le(),o=A(t);{var v=y=>{var S=ce(),J=r(S);{var K=p=>{var P=G();h(()=>F(P,i(T))),n(p,P)},L=p=>{var P=D(),N=A(P);C(N,()=>e.icon,()=>i(T)),n(p,P)};O(J,p=>{!e.icon||typeof e.icon=="string"?p(K):p(L,!1)})}s(S),n(y,S)};O(o,y=>{e.icon!==null&&y(v)})}var m=w(o,2),f=r(m);C(f,()=>e.children),s(m),n(a,t)},g=Z(e,"status",3,"inform"),l=b(()=>E[g()]),x=b(()=>i(l).color),j=b(()=>i(l).icon),k=b(()=>e.color??i(x)),T=b(()=>typeof e.icon=="string"?e.icon:i(j)??E.inform.icon);var z=D(),B=A(z);{var R=a=>{var t=ve();let o;var v=r(t);u(v),s(t),h(()=>{o=M(t,o,{class:"message",type:"button",onclick:e.onclick,disabled:e.disabled,...e.attrs},"svelte-tarwjh"),q(t,"--text_color",i(k))}),n(a,t)},c=a=>{var t=_e();let o;var v=r(t);u(v),s(t),h(()=>{o=M(t,o,{role:"alert",class:"message panel",...e.attrs},"svelte-tarwjh"),q(t,"--text_color",i(k))}),n(a,t)};O(B,a=>{e.onclick?a(R):a(c,!1)})}n(d,z),I()}var ue=_("<p>cannot find <code> </code></p>"),ge=_('<div class="mb_lg"><!></div>'),me=_('<div class="repos_tree_nav svelte-12giiu4"><!></div>'),fe=_('<main class="box w_100"><div class="p_lg"><!></div> <section class="tree svelte-12giiu4"><!> <!></section> <section class="box mb_xl7 svelte-12giiu4"><!></section></main>');function pe(d,e){H(e,!0);const u=b(()=>e.repos.find(c=>c.repo_name===e.slug));var g=fe();W(c=>{h(()=>X.title=`${e.slug??""} - tree ${e.repo.package_json.glyph??""} ${e.repo.package_json.name??""}`)});var l=r(g),x=r(l);ae(x,{get pkg(){return e.repo}}),s(l);var j=w(l,2),k=r(j);{var T=c=>{var a=ge(),t=r(a);de(t,{status:"error",children:(o,v)=>{var m=ue(),f=w(r(m)),y=r(f,!0);s(f),s(m),h(()=>F(y,e.slug)),n(o,m)},$$slots:{default:!0}}),s(a),n(c,a)};O(k,c=>{i(u)||c(T)})}var z=w(k,2);se(z,{get repos(){return e.repos},get selected_repo(){return i(u)},nav:a=>{var t=me(),o=r(t);re(o,{children:(v,m)=>{Y();var f=G();h(()=>F(f,e.repo.package_json.glyph)),n(v,f)},$$slots:{default:!0}}),s(t),n(a,t)},$$slots:{nav:!0}}),s(j);var B=w(j,2),R=r(B);oe(R,{}),s(B),s(g),n(d,g),I()}function ze(d,e){H(e,!0);const u=$(),g=()=>ee(te,"$page",u),{repo:l,repos:x}=U.get();pe(d,{repo:l,repos:x,get slug(){return g().params.slug}}),I()}export{ze as component,Te as universal};
