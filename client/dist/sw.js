if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const l=e||("document"in self?document.currentScript.src:"")||location.href;if(s[l])return;let o={};const t=e=>i(e,l),u={module:{uri:l},exports:o,require:t};s[l]=Promise.all(n.map((e=>u[e]||t(e)))).then((e=>(r(...e),o)))}}define(["./workbox-b1f6ddb5"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-3852a342.js",revision:null},{url:"assets/browser-99a01eee.js",revision:null},{url:"assets/ccip-c6eacb00.js",revision:null},{url:"assets/index-00e00fa3.css",revision:null},{url:"assets/index-787c7fda.js",revision:null},{url:"assets/index-7db29e5b.js",revision:null},{url:"assets/index-b481c23c.js",revision:null},{url:"assets/index-f92a9842.js",revision:null},{url:"assets/index.es-37e59530.js",revision:null},{url:"index.html",revision:"a1b27c02cc4e19a818b19ea07a5c8a54"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"android-chrome-192x192.png",revision:"acd28e6206ff17c6f94e6974db6bd721"},{url:"android-chrome-512x512.png",revision:"608126d54ef10cea4733bfb03b7bffe3"},{url:"manifest.webmanifest",revision:"295115bfbff6a032425c8644a1180363"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
