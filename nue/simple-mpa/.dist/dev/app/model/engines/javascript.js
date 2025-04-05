// simple-mpa/app/model/engines/javascript.js
var events = [];
function add_events(input) {
  const arr = input.split(`
`).map((line) => line.trim()).filter((line) => line.length > 0).map((line) => JSON.parse(line));
  events.push(...arr);
}
function get_total() {
  return events.length;
}
function clear() {
  events.splice(0, events.length);
}
function all(params) {
  const entries = sortEntries(params.sort_by, params.ascending);
  return paginate(entries, params.start, params.length);
}
function filter(filters, params) {
  const { start, length, sort_by, ascending } = params;
  const { type, plan, size } = filters;
  let matches = type ? events.filter((el) => el.type == type) : events;
  if (plan)
    matches = events.filter((el) => el.data.plan == plan);
  if (size)
    matches = events.filter((el) => el.data.size == size);
  return paginate(matches, start, length);
}
function search(query, params) {
  const { start, length, sort_by, ascending } = params;
  const q = query.toLowerCase();
  let matches = events.filter((event) => {
    const message = (event.data.message || "").toLowerCase();
    const name = (event.data.name || "").toLowerCase();
    const email = (event.data.email || "").toLowerCase();
    return message && message.includes(q) || name && name.includes(q) || email && email.includes(q);
  });
  return paginate(matches, start, length);
}
function get(id) {
  const el = events.find((event) => event.data.id == id);
  return el ? JSON.stringify(el) : null;
}
function paginate(events2, start, length) {
  const total = events2.length;
  const end = Math.min(start + length, total);
  const items = events2.slice(start, end).map((item) => JSON.stringify(item)).join(",");
  return `{"total":${total},"start":${start},"length":${length},"items":[${items}]}`;
}
var planOrder = ["free", "pro", "enterprise"];
var sizeOrder = ["s", "m", "l", "xl"];
function sortEntries(sort_by, ascending) {
  return [...events].sort((a, b) => {
    const field = sort_by || "id";
    let compare = 0;
    if (field == "id")
      compare = a.data.id - b.data.id;
    else if (field == "cc")
      compare = a.data.cc.localeCompare(b.data.cc);
    else if (field == "size")
      compare = sizeOrder.indexOf(a.data.size || "s") - sizeOrder.indexOf(b.data.size || "s");
    else if (field == "plan")
      compare = planOrder.indexOf(a.data.plan) - planOrder.indexOf(b.data.plan);
    return ascending ? compare : -compare;
  });
}
export {
  search,
  get_total,
  get,
  filter,
  clear,
  all,
  add_events
};
