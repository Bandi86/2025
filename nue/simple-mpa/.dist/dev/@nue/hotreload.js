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

// ../../../../.bun/install/global/node_modules/nuekit/src/browser/hotreload.js
import { mountAll } from "./mount.js";
var sse = new EventSource(location.origin);
var $ = (query, root = document) => root.querySelector(query);
sse.onmessage = async function(e) {
  const data = e.data ? JSON.parse(e.data) : {};
  const { error, html, css, dir, url, path } = data;
  if (data.site_updated)
    return location.reload();
  $(".nuerr")?.remove();
  if (error) {
    Object.assign(error, { path, ext: data.ext?.slice(1) });
    import("./error.js").then((el) => el.showError(error));
  }
  if (html) {
    const uri = url.replace("/index.html", "/");
    if (data.is_md && location.pathname != uri)
      location.href = uri;
    else {
      await patch(html);
      dispatchEvent(new Event("reload"));
    }
  }
  if (data.is_dhtml || data.is_htm) {
    remount("/" + data.path.replace(data.ext, ".js"));
    dispatchEvent(new Event("hmr"));
  }
  if (css) {
    const href = `/${dir}${dir ? "/" : ""}${data.name}.css`;
    const orig = $(`[href="${href}"]`);
    const style = createStyle(href, css);
    if (orig)
      orig.replaceWith(style);
    else if (canAdd(data))
      document.head.appendChild(style);
  }
  if (data.remove && data.ext == ".css") {
    const orig = $(`[href="/${data.path}"]`);
    if (orig)
      orig.remove();
  }
};
function canAdd({ dir, name, basedir }) {
  if (contains(getMeta("exclude"), name))
    return false;
  if (getMeta("globals")?.includes(dir))
    return true;
  if (getMeta("libs")?.includes(dir) && contains(getMeta("include"), name))
    return true;
  const appdir = location.pathname.split("/")[1];
  return appdir == basedir;
}
function getMeta(key) {
  return $(`[name="nue:${key}"]`)?.getAttribute("content")?.split(" ");
}
function contains(matches, name) {
  return matches?.find((match) => name.includes(match));
}
function createStyle(href, css) {
  const el = document.createElement("style");
  el.setAttribute("href", href);
  el.innerHTML = css;
  return el;
}
function deserialize(form, formdata) {
  for (const [key, val] of formdata.entries()) {
    const el = form.elements[key];
    if (el.type == "checkbox")
      el.checked = !!val;
    else
      el.value = val;
  }
}
async function remount(path) {
  const data = [...document.forms].map((form) => new FormData(form));
  const popover = $("[popover]");
  const pid = popover?.checkVisibility() && popover.id;
  const dialog = $("dialog[open]");
  await mountAll(path);
  data.forEach((formdata, i) => deserialize(document.forms[i], formdata));
  if (pid) {
    const el = window[pid];
    el?.showPopover();
  }
  if (dialog) {
    const el = window[dialog.id];
    if (el) {
      el.close();
      el.showModal();
    }
  }
}
function parsePage(html) {
  const root = document.createElement("html");
  root.innerHTML = html;
  return { title: $("title", root)?.textContent, body: $("body", root) };
}
async function patch(html) {
  const { DiffDOM } = await import("/@nue/diffdom.js");
  const Diff = new DiffDOM;
  const old_body = $("body");
  const { title, body } = parsePage(html);
  if (title)
    document.title = title;
  const diff = Diff.diff(old_body, body);
  Diff.apply(old_body, diff);
  await mountAll();
}
