if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const l=e||("document"in self?document.currentScript.src:"")||location.href;if(s[l])return;let o={};const t=e=>i(e,l),u={module:{uri:l},exports:o,require:t};s[l]=Promise.all(n.map((e=>u[e]||t(e)))).then((e=>(r(...e),o)))}}define(["./workbox-b1f6ddb5"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/browser-3852a342.js",revision:null},{url:"assets/browser-99a01eee.js",revision:null},{url:"assets/ccip-27c4d519.js",revision:null},{url:"assets/index-1e1ab041.css",revision:null},{url:"assets/index-51feaec1.js",revision:null},{url:"assets/index-5c1fa058.js",revision:null},{url:"assets/index-d4432751.js",revision:null},{url:"assets/index-e9a849fe.js",revision:null},{url:"assets/index.es-1118b369.js",revision:null},{url:"index.html",revision:"ec4b4ea0196008ff8c056fa76ecb0767"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"android-chrome-192x192.png",revision:"acd28e6206ff17c6f94e6974db6bd721"},{url:"android-chrome-512x512.png",revision:"608126d54ef10cea4733bfb03b7bffe3"},{url:"manifest.webmanifest",revision:"ecb039e07094121e03f4eb2ebeb92908"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
