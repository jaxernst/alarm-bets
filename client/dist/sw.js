if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const l=e||("document"in self?document.currentScript.src:"")||location.href;if(s[l])return;let o={};const t=e=>i(e,l),d={module:{uri:l},exports:o,require:t};s[l]=Promise.all(n.map((e=>d[e]||t(e)))).then((e=>(r(...e),o)))}}define(["./workbox-b1f6ddb5"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-3852a342.js",revision:null},{url:"assets/browser-99a01eee.js",revision:null},{url:"assets/ccip-0c04b87f.js",revision:null},{url:"assets/index-5485ed9a.css",revision:null},{url:"assets/index-60f1873a.js",revision:null},{url:"assets/index-6346afde.js",revision:null},{url:"assets/index-765b6918.js",revision:null},{url:"assets/index-bff164ac.js",revision:null},{url:"assets/index.es-8d8a0e25.js",revision:null},{url:"index.html",revision:"99aeabe7211450d4c70bbc79b142d965"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"android-chrome-192x192.png",revision:"acd28e6206ff17c6f94e6974db6bd721"},{url:"android-chrome-512x512.png",revision:"608126d54ef10cea4733bfb03b7bffe3"},{url:"manifest.webmanifest",revision:"ecb039e07094121e03f4eb2ebeb92908"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));