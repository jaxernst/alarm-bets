if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const l=e||("document"in self?document.currentScript.src:"")||location.href;if(s[l])return;let o={};const t=e=>i(e,l),u={module:{uri:l},exports:o,require:t};s[l]=Promise.all(n.map((e=>u[e]||t(e)))).then((e=>(r(...e),o)))}}define(["./workbox-b1f6ddb5"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-3852a342.js",revision:null},{url:"assets/browser-99a01eee.js",revision:null},{url:"assets/ccip-ce766ae4.js",revision:null},{url:"assets/index-18e961a8.css",revision:null},{url:"assets/index-5bcbeade.js",revision:null},{url:"assets/index-a4a447e9.js",revision:null},{url:"assets/index-ba360006.js",revision:null},{url:"assets/index-ec9af399.js",revision:null},{url:"assets/index.es-bafe4be8.js",revision:null},{url:"index.html",revision:"5c9d771f9ff34d7d1758bf157f025bf4"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"android-chrome-192x192.png",revision:"acd28e6206ff17c6f94e6974db6bd721"},{url:"android-chrome-512x512.png",revision:"608126d54ef10cea4733bfb03b7bffe3"},{url:"manifest.webmanifest",revision:"ecb039e07094121e03f4eb2ebeb92908"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
