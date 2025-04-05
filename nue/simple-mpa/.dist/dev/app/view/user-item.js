
  import { formatDate } from './util.js'

export const lib = [
{
  name: 'user-item',
  tagName: 'a',
  tmpl: '<a :href="0"> <aside> <small class><icon :key="1"></icon>:2:</small> <time>:3:</time> </aside> <media :image="4" :title="5" width="32"> <p :html="6"></p> </media> <div class="meta"> <span :if="7"> <pill icon="dot" :label="9" :class="8"></pill> </span> <span :if="10"> <pill icon="square" :label="12" :class="11"></pill> </span> <span :if="13" class="plain pill"> <icon key="image"></icon>:14:</span> </div> <blockquote :html="15"></blockquote> </a>',
  Impl: class { 
    formatDate = formatDate
   },
  fns: [
    _ => ['?id=',_.id],
    _ => _.type,
    _ => [' ',_.type?.replace('_', ' ')],
    _ => [_.formatDate(_.created)],
    _ => ['/app/icon/cc/',_.cc,'.svg'],
    _ => _.name,
    _ =>  _.email ,
    _ => _.size,
    _ => ['pill ','size-' + _.size.key],
    _ => _.size.label,
    _ => _.plan,
    _ => ['pill ','plan-' + _.plan],
    _ => _.plan,
    _ => _.shots,
    _ => [' ',_.shots.length,' '],
    _ =>  _.message 
  ]
}]
export default lib[0]