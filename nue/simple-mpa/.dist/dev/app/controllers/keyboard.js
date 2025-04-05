// simple-mpa/app/controllers/keyboard.js
import { $, $$ } from "/@nue/view-transitions.js";
import { router } from "/@nue/app-router.js";
var ITEM = "a.list-item";
document.addEventListener("keydown", (evt) => {
  const { target, key } = evt;
  const actions = {};
  const first = $(ITEM);
  const search = $("[type=search]");
  if (key == "Tab") {
    if (target == search && search.value) {
      evt.preventDefault();
      first.focus();
    }
    if (evt.shiftKey && first == document.activeElement) {
      evt.preventDefault();
      search.focus();
    }
  }
  if (key == "k" && evt.metaKey)
    search.focus();
  if (target.oninput || target.form || evt.defaultPrevented || evt.metaKey || evt.ctrlKey)
    return;
  if (key == "Escape" && !$(":popover-open"))
    router.del("id");
  if (key == "/")
    evt.preventDefault();
  $$("[data-accesskey]").filter((el) => !el.disabled && !el.ariaPressed).forEach((el) => {
    if (el.dataset.accesskey.split(" ").includes(key)) {
      el.focus();
      el.click();
    }
  });
  if (["ArrowDown", "j", "ArrowUp", "k"].includes(key)) {
    const next = getNext(["ArrowDown", "j"].includes(key));
    next?.focus();
    if (router.state.id)
      next?.click();
    evt.preventDefault();
  }
});
function getNext(go_forward) {
  const active = document.activeElement;
  if (!active || !active.matches(ITEM))
    return $(ITEM);
  const links = $$(ITEM);
  const next = links[links.indexOf(active) + (go_forward ? 1 : -1)];
  if (next)
    return next;
  const btn = $(`[data-accesskey="${go_forward ? "ArrowRight l" : "ArrowLeft h"}"]`);
  if (!btn.disabled) {
    btn.click();
    const links2 = $$(ITEM);
    return links2[go_forward ? 0 : links2.length - 1];
  }
}
