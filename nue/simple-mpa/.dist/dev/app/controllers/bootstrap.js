// simple-mpa/app/controllers/bootstrap.js
import { router } from "/@nue/app-router.js";
import { model } from "../model/index.js";
import { mount } from "/@nue/mount.js";
router.configure({
  route: "/app/:type/:filter",
  url_params: ["query", "id", "start", "sort", "asc", "shot"],
  session_params: ["plans_opened", "sizes_opened", "nav_opened"],
  persistent_params: ["show_grid_view"]
});
addEventListener("route:app", async () => {
  if (model.authenticated) {
    await model.initialize();
  } else {
    mount("login-screen", window.login);
  }
});
addEventListener("hmr", () => {
  app.classList.add("hmr");
  setTimeout(() => app.classList.remove("hmr"), 100);
});
model.on("authenticated", async () => {
  await model.load();
  window.login.innerHTML = "";
  mount("app", window.app);
});
if (window.app)
  dispatchEvent(new Event("route:app"));
