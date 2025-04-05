
  import { router } from '/@nue/app-router.js'

export const lib = [
{
  name: 'collection',
  tagName: 'section',
  tmpl: '<section> <header class="subheader"> <sort-buttons></sort-buttons> </header> <ul :class="0"> <li :for="1"> <user-item :bind="2" class="list-item appears" :style="3"></user-item> </li> <li :if="4">No records found</li> </ul> </section>',
  Impl: class { 
    constructor() {
      router.bind('show_grid_view', () => this.update())
    }
   },
  fns: [
    _ => [_.router.state.show_grid_view ? 'grid-view' : 'table-view'],
    _ => ['item', _.items, 'index'],
    _ => _.item,
    _ => ['--delay: ',_.index],
    _ => !_.items.length
  ]
}]
export default lib[0]