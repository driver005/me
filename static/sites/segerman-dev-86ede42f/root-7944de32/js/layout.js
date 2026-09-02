const h="modulepreload",b=function(n){return"/"+n},m={},v=function(e,a,w){let i=Promise.resolve();if(a&&a.length>0){let c=function(t){return Promise.all(t.map(l=>Promise.resolve(l).then(s=>({status:"fulfilled",value:s}),s=>({status:"rejected",reason:s}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),u=o?.nonce||o?.getAttribute("nonce");i=c(a.map(t=>{if(t=b(t),t in m)return;m[t]=!0;const l=t.endsWith(".css"),s=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${t}"]${s}`))return;const r=document.createElement("link");if(r.rel=l?"stylesheet":h,l||(r.as="script"),r.crossOrigin="",r.href=t,u&&r.setAttribute("nonce",u),document.head.appendChild(r),l)return new Promise((p,g)=>{r.addEventListener("load",p),r.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${t}`)))})}))}function d(c){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=c,window.dispatchEvent(o),!o.defaultPrevented)throw c}return i.then(c=>{for(const o of c||[])o.status==="rejected"&&d(o.reason);return e().catch(d)})},x=()=>{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return!1;try{const e=document.createElement("canvas").getContext("webgl2");return e?(e.getExtension("WEBGL_lose_context")?.loseContext(),!0):!1}catch{return!1}},E=()=>{const n=document.documentElement;n.classList.add("no-webgl","loaded"),n.classList.remove("is-transitioning"),document.querySelector(".loader")?.remove(),document.querySelector(".canvas")?.remove(),document.querySelector(".overlay")?.remove(),document.querySelectorAll("video.media").forEach(e=>{e.muted=!0,e.loop=!0,e.setAttribute("preload","auto"),e.play?.().catch(()=>{})}),document.querySelectorAll("[data-email]").forEach(e=>{e.addEventListener("click",()=>{const a=e.getAttribute("data-email");window.location.href=`mailto:${a}`})})},f=()=>{x()?v(()=>import("./app.8ySn1L4n.js").then(a=>a.d),[]):E();const e=`data:image/svg+xml;base64,${btoa(`<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 0C6.36197 0 6.71623 0.0333036 7.06055 0.0947266C5.76227 0.42476 4.80176 1.59903 4.80176 3C4.80176 4.65685 6.1449 6 7.80176 6C9.45842 5.99977 10.8018 4.65671 10.8018 3C10.8018 2.75475 10.7684 2.51723 10.7129 2.28906C11.5181 3.31033 12 4.59852 12 6C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6C0 2.68629 2.68629 0 6 0Z" fill="black"/>
                        </svg>
                        `,!0)}`;console.log("%c Developed by Raphael Segerman",`
        padding-left: 32px;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-right: 20px;
        background-size: 12px;
          background-position: 12px center;
          background-repeat: no-repeat;
          background-image: url(${e});
          background-color: #ffffff;
          color: #00031F;
          border-bottom: 3px solid black;
          border-left: 3px solid black;
          border-radius: 4px;
          border-top: 1px solid black;
          border-right: 1px solid black;`),console.log("https://segerman.dev/")};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",f):f();export{v as _};
//# sourceMappingURL=Layout.astro_astro_type_script_index_0_lang.BYGFA18R.js.map
