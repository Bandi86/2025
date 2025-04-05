// simple-mpa/app/view/util.js
import { $, $$ } from "/@nue/view-transitions.js";
var TODAY = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
var THIS_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
var OLDER = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
function formatDate(date) {
  const now = new Date;
  return date.toDateString() === now.toDateString() ? TODAY.format(date) : date.getFullYear() === now.getFullYear() ? THIS_YEAR.format(date) : OLDER.format(date);
}
function formatBody(body) {
  return body.split(`
`).map((p) => `<p>${p}</p>`).join("");
}
function onDialogClose(dialog, fn) {
  let handler = () => {
    if (!dialog.matches(":popover-open")) {
      fn();
      dialog.removeEventListener("toggle", handler);
    }
  };
  dialog.addEventListener("toggle", handler);
}
function setSelected(query, attrname, value = true) {
  for (const el of $$(`[${attrname}]`))
    el.removeAttribute(attrname);
  $(query)?.setAttribute(attrname, value);
}
export {
  setSelected,
  onDialogClose,
  formatDate,
  formatBody
};
