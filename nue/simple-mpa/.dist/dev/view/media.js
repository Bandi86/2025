
export const lib = [
{
  name: 'media',
  tagName: 'div',
  tmpl: '<div class="media"> <figure><img :src="0" :width="1" :height="2"></figure> <div> <h2 :html="3"></h2> <slot></slot> </div></div>',
  fns: [
    _ => _.image,
    _ => _.width || 40,
    _ => _.height || _.width || 40,
    _ =>  _.title 
  ]
}]
export default lib[0]