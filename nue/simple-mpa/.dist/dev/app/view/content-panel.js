
  import { $ } from '/@nue/view-transitions.js'
  import { router } from '/@nue/app-router.js'
  import { model } from '../model/index.js'

export const lib = [
{
  name: 'content-panel',
  tagName: 'div',
  tmpl: '<div> <header> <button class="ghost mobile mr" @click="0"><icon key="panel-left"></icon></button> <h2 @click="1" :html="2"></h2> <nav> <small>:3:</small> <button class="ghost" data-accesskey="ArrowLeft h" title="Previous page" @click="4" $disabled="5"><icon key="chevron-left"></icon></button> <button class="ghost" data-accesskey="ArrowRight l" title="Next page" @click="6" $disabled="7"> <icon key="chevron-right"></icon></button> <hr> <button class="ghost" data-accesskey="g" :aria-pressed="9" title="Toggle table view" @click="8"><icon key="list"></icon></button> <button class="ghost" data-accesskey="g" :aria-pressed="11" title="Toggle grid view" @click="10"><icon key="grid"></icon></button> <hr> <button class="ghost" popovertarget="help" data-accesskey="?" title="Show keyboard shortcuts"><icon key="question"></icon></button> </nav> </header> <section id="main_wrap"></section> </div>',
  Impl: class { 
    router = router

    toggleGridView() {
      router.toggle('show_grid_view')
    }

    navOpen() {
      router.set('nav_opened', true)
    }

    getTitle() {
      const { views, company_sizes, plans } = this.config
      const { type, filter } = router.state

      const view = views.find(el => el.type == type)
      const size = company_sizes[filter]
      const plan = plans[filter]

      return plan ? `${ plan } plans` : size ? `${ size } companies` :
        view ? view.title : 'All contacts'
    }

    mounted() {
      router.bind('type query filter start sort asc', args => {
        const data = this.coll = model.filter(args)
        this.mountChild('collection', window.main_wrap, data)
        this.update()

      })
    }

    seek(to) {
      const { start, length } = this.coll
      router.set({ start: start + to*length })
    }

    status() {
      const { start, length, total } = this.coll || {}
      return `${ start + 1 } – ${ start + length } of ${ total }`
    }
   },
  fns: [
    (_,e) => { _.navOpen.call(_, e) },
    (_,e) => { _.navOpen.call(_, e) },
    _ =>  _.getTitle() ,
    _ => [_.status()],
    (_,e) => { _.seek(-1) },
    _ => !_.coll?.start,
    (_,e) => { _.seek(1) },
    _ => _.coll?.start + _.coll?.length >= _.coll?.total,
    (_,e) => { _.toggleGridView.call(_, e) },
    _ => !_.router.state.show_grid_view,
    (_,e) => { _.toggleGridView.call(_, e) },
    _ => _.router.state.show_grid_view
  ]
}]
export default lib[0]