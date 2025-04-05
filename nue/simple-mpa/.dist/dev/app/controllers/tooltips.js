// simple-mpa/app/controllers/tooltips.js
if (CSS.supports("anchor-name: --tip")) {
  let addTitle2 = function(e) {
    let el = e.target;
    if (el.nodeType != 1)
      return;
    const data = el.dataset;
    if (el.title) {
      data.title = el.title;
      el.removeAttribute("title");
    }
    if (e instanceof FocusEvent)
      return;
    if (data.title) {
      const kbd = data.accesskey?.split(" ").pop();
      tip.innerHTML = data.title + (kbd ? ` <kbd>${kbd}</kbd>` : "");
      el.style["anchor-name"] = "--tip";
      tip.classList.add("is-shown");
      tip.classList.toggle("on-bottom", el.closest("header"));
      el.onmouseleave = cleanup2;
    }
  }, cleanup2 = function(e) {
    e.target.style?.removeProperty("anchor-name");
    tip.classList.remove("is-shown");
  };
  addTitle = addTitle2, cleanup = cleanup2;
  const tip = document.createElement("span");
  document.body.append(tip);
  tip.role = "tooltip";
  tip.id = "tip";
  document.addEventListener("mouseenter", addTitle2, true);
  document.addEventListener("focus", addTitle2, true);
  document.addEventListener("click", cleanup2, true);
} else {
  let addTitle2 = function(e) {
    const el = e.target;
    if (el.nodeType == 1 && !el.dataset.titled && el.title && el.dataset.accesskey) {
      el.title = `${el.title} [${el.dataset.accesskey.split(" ").pop()}]`;
      el.dataset.titled = true;
    }
  };
  addTitle = addTitle2;
  document.addEventListener("mouseenter", addTitle2, true);
  document.addEventListener("focus", addTitle2, true);
}
var addTitle;
var cleanup;
