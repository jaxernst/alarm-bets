if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const l=e||("document"in self?document.currentScript.src:"")||location.href;if(s[l])return;let o={};const t=e=>i(e,l),d={module:{uri:l},exports:o,require:t};s[l]=Promise.all(n.map((e=>d[e]||t(e)))).then((e=>(r(...e),o)))}}define(["./workbox-b1f6ddb5"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-3852a342.js",revision:null},{url:"assets/browser-99a01eee.js",revision:null},{url:"assets/ccip-38c1cade.js",revision:null},{url:"assets/index-57eeb8c8.js",revision:null},{url:"assets/index-81daf2bd.js",revision:null},{url:"assets/index-98b7fb7b.js",revision:null},{url:"assets/index-a4318915.js",revision:null},{url:"assets/index-eb1f5e97.css",revision:null},{url:"assets/index.es-f33ac20c.js",revision:null},{url:"index.html",revision:"36449641bd6a4a19716a282bf5835047"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"android-chrome-192x192.png",revision:"e613c75239e314a61f55b132a6903911"},{url:"android-chrome-512x512.png",revision:"132927e709a43ea7d1ee2ef28f2efded"},{url:"manifest.webmanifest",revision:"1c039410aa8e163d30dc8e3050e41c7d"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
