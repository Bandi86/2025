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

// simple-mpa/app/model/index.js
import { loadChunks } from "./event-sourcing.js";
import { fetchWithAuth, login } from "./auth.js";
import { createUser } from "./users.js";
var use_rust = sessionStorage.rust || location.search.includes("rust");
if (use_rust)
  sessionStorage.rust = true;
async function loadRustEngine() {
  const module = await import("./wasm/engine.js");
  const init = module.default;
  const { Engine } = module;
  await init();
  return new Engine;
}
async function loadEngine() {
  return use_rust ? await loadRustEngine() : await import("./engines/javascript.js");
}
var engine = await loadEngine();
var handlers = [];
var CACHE = {};
var model = {
  on(event, fn) {
    handlers.push({ event, fn });
  },
  search(query, params) {
    const data = parseItems(engine.search(query, params));
    data.items.forEach((el) => searchHilite(query, el));
    return data;
  },
  filter(args) {
    const { type, query, filter } = args;
    const params = {
      ascending: !!args.asc || undefined,
      start: parseInt(args.start) || 0,
      sort_by: args.sort,
      length: 12
    };
    if (!type || type == "search" && !query)
      return model.all(params);
    if (query)
      return model.search(query, params);
    const opts = filter ? { [type]: filter } : { type };
    const str = engine.filter(opts, params);
    return parseItems(str);
  },
  get(id) {
    if (CACHE[id])
      return CACHE[id];
    const item = engine.get(id);
    if (item)
      return CACHE[id] = createUser(JSON.parse(item), model.total);
  },
  all(params) {
    return parseItems(engine.all(params));
  },
  get authenticated() {
    return !!localStorage.sid;
  },
  async login(email, password) {
    const { sessionId, user } = await login(email, password);
    localStorage.sid = sessionId;
    model.user = user;
    emit("authenticated", user);
  },
  logout() {
    delete localStorage.sid;
    delete model.user;
    emit("logout");
  },
  async load() {
    const total = engine.get_total();
    if (total > 0)
      return model.total = total;
    const chunks = await loadChunks();
    chunks.forEach((chunk) => engine.add_events(chunk));
    model.total = engine.get_total();
  },
  async initialize() {
    if (model.authenticated) {
      if (!model.user)
        model.user = await fetchWithAuth("user.json");
      emit("authenticated");
    }
  }
};
function emit(event, data) {
  handlers.forEach((h) => {
    if (h.event === event)
      h.fn(data);
  });
}
function searchHilite(query, data) {
  const re = new RegExp(`(${query})`, "gi");
  "name email message".split(" ").forEach((key) => {
    data[key] = data[key].replace(re, "<mark>$1</mark>");
  });
}
function parseItems(str) {
  const data = JSON.parse(str);
  data.items = data.items.map((item) => createUser(item, model.total));
  return data;
}
export {
  model
};
