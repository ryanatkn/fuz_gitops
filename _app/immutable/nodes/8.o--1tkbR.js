import{p as G,s as H,a as I,h as M,g as J}from"../chunks/repo.D9KUsRR3.js";import{r as K}from"../chunks/repos.CcHmjfZk.js";import{v as q,f as R,c as a,r,a as s,t as d,e as D,b as S,s as _,h as L,$ as N,d as Q}from"../chunks/disclose-version.VlcF2N1U.js";import{p as A,t as b,g as c,a as F,d as p}from"../chunks/runtime.NqF6ywm4.js";import{s as U,a as V,p as W}from"../chunks/stores.Cx--q540.js";import{p as X,i as T}from"../chunks/props.dsyMs83D.js";import{P as Y,a as Z,B as $}from"../chunks/Page_Header.CGDX8AQL.js";import{R as ee}from"../chunks/Repos_Tree.LL78z4wi.js";const te=G(K,"https://gitops.fuz.dev/"),oe=()=>te.repos.map(u=>({slug:u.repo_name})),je=Object.freeze(Object.defineProperty({__proto__:null,entries:oe},Symbol.toStringTag,{value:"Module"})),C={inform:{color:"var(--text_color_3)",icon:"✻"},help:{color:"var(--color_b_5)",icon:"➺"},error:{color:"var(--color_c_5)",icon:"!?"}};var ae=d('<div class="icon svelte-tarwjh"><!></div>'),re=d('<!> <div class="content svelte-tarwjh"><!></div>',1),se=d("<button><!></button>"),ne=d("<div><!></div>");function ie(u,e){A(e,!0);const g=n=>{var t=re(),o=R(t);T(o,()=>e.icon!==null,f=>{var l=ae(),B=a(l);T(B,()=>!e.icon||typeof e.icon=="string",O=>{var y=D();b(()=>S(y,c(P))),s(O,y)},O=>{var y=q(),E=R(y);M(E,()=>e.icon,()=>c(P)),s(O,y)}),r(l),s(f,l)});var i=_(_(o,!0)),w=a(i);M(w,()=>e.children),r(i),s(n,t)},m=X(e,"status",3,"inform"),v=p(()=>C[m()]),h=p(()=>c(v).color),x=p(()=>c(v).icon),j=p(()=>e.color??c(h)),P=p(()=>typeof e.icon=="string"?e.icon:c(x)??C.inform.icon);var k=q(),z=R(k);T(z,()=>e.onclick,n=>{var t=se();let o;var i=a(t);g(i),r(t),b(()=>{o=H(t,o,{class:"message",type:"button",onclick:e.onclick,disabled:e.disabled,...e.attrs},"svelte-tarwjh"),I(t,"--text_color",c(j),void 0,!0)}),s(n,t)},n=>{var t=ne();let o;var i=a(t);g(i),r(t),b(()=>{o=H(t,o,{role:"alert",class:"message panel",...e.attrs},"svelte-tarwjh"),I(t,"--text_color",c(j),void 0,!0)}),s(n,t)}),s(u,k),F()}var ce=d("<p>cannot find <code> </code></p>"),le=d('<div class="mb_lg"><!></div>'),_e=d('<div class="repos_tree_nav svelte-12giiu4"><!></div>'),ve=d('<main class="box w_100"><div class="p_lg"><!></div> <section class="tree svelte-12giiu4"><!> <!></section> <section class="box mb_xl7 svelte-12giiu4"><!></section></main>');function de(u,e){A(e,!0);const g=p(()=>e.repos.find(n=>n.repo_name===e.slug));var m=ve();L(n=>{b(()=>N.title=`${e.slug??""} - tree ${e.repo.package_json.glyph??""} ${e.repo.package_json.name??""}`)});var v=a(m),h=a(v);Y(h,{get pkg(){return e.repo}}),r(v);var x=_(_(v,!0)),j=a(x);T(j,()=>!c(g),n=>{var t=le(),o=a(t);ie(o,{status:"error",children:(i,w)=>{var f=ce(),l=_(a(f)),B=a(l);r(l),r(f),b(()=>S(B,e.slug)),s(i,f)},$$slots:{default:!0}}),r(t),s(n,t)});var P=_(_(j,!0));ee(P,{get repos(){return e.repos},get selected_repo(){return c(g)},nav:t=>{var o=_e(),i=a(o);$(i,{children:(w,f)=>{Q();var l=D();b(()=>S(l,e.repo.package_json.glyph)),s(w,l)},$$slots:{default:!0}}),r(o),s(t,o)}}),r(x);var k=_(_(x,!0)),z=a(k);Z(z,{}),r(k),r(m),s(u,m),F()}function ke(u,e){A(e,!0);const g=U(),m=()=>V(W,"$page",g),{repo:v,repos:h}=J();de(u,{repo:v,repos:h,get slug(){return m().params.slug}}),F()}export{ke as component,je as universal};