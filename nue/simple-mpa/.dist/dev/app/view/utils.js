
export const lib = [
{
  name: 'icon',
  tagName: 'svg',
  tmpl: '<svg :class="0"> <use :href="1"/></svg>',
  fns: [
    _ => ['icon ',_.key,'-icon'],
    _ => ['#',_.key,'-symbol']
  ]
},{
  name: 'pill',
  tagName: 'span',
  tmpl: '<span class="pill"> <icon :key="0"></icon>:1:</span>',
  fns: [
    _ => _.icon,
    _ => [' ',_.label,' ']
  ]
}]
export default lib[0]