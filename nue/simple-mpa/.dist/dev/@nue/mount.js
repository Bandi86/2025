var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// ../../../../.bun/install/global/node_modules/nuekit/src/browser/mount.js
var apps = [];
var remounts = 0;
async function importAll(hmr_path) {
  const comps = document.querySelector('[name="nue:components"]')?.getAttribute("content");
  if (!comps)
    return [];
  const arr = [];
  for (let path of comps.split(" ")) {
    if (path) {
      if (path == hmr_path)
        path += `?${++remounts}`;
      const { lib } = await import(path);
      if (lib)
        arr.push(...lib);
    }
  }
  return arr;
}
async function mount(name, wrap, data) {
  const lib = await importAll();
  const comp = lib.find((el) => el.name == name);
  if (!comp)
    return;
  const { createApp } = await import("./nue.js");
  const app = createApp(comp, data, lib).mount(wrap);
  app.root.setAttribute("custom", name);
  return app;
}
async function mountAll(hmr_path) {
  const els = document.querySelectorAll("[custom]");
  const lib = els[0] ? await importAll(hmr_path) : [];
  if (!lib[0])
    return;
  const { createApp } = await import("./nue.js");
  for (const node of [...els]) {
    const name = node.getAttribute("custom");
    const next = node.nextElementSibling;
    const data = next?.type == "application/json" ? JSON.parse(next.textContent) : {};
    const comp = lib.find((a) => a.name == name);
    if (comp) {
      const app = createApp(comp, data, lib).mount(node);
      apps.push(app);
    } else if (customElements.get(name)) {} else {}
  }
}
async function unmountAll() {
  apps.forEach((app) => app.unmount());
  apps = [];
}
addEventListener("route", () => mountAll());
addEventListener("DOMContentLoaded", () => dispatchEvent(new Event("route")));
export {
  unmountAll,
  mountAll,
  mount
};
