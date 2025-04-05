
  import { router } from '/@nue/app-router.js'
  import { model } from '../model/index.js'
  import { setSelected } from './util.js'

export const lib = [
{
  name: 'details-panel',
  tagName: 'aside',
  tmpl: '<aside $hidden="0"> <header class="appears" style="--delay: 0"> <h2>Conversation</h2> <nav> <button class="ghost" title="Close" data-accesskey="Esc" @click="1"> <icon key="x"></icon> </button> </nav> </header> <section id="details_body" class="appears" style="--delay: 2"></section> <footer> <div id="details_footer"></div> </footer> </aside>',
  Impl: class { 
    router = router

    mounted() {
      router.bind('id', ({ id }) => {
        const item = model.get(id)

        if (item) {
          this.mountChild('user-details', window.details_body, item)
          this.mountChild('chat-form', window.details_footer, item)
        }

        setSelected(`a[href="?id=${id}"]`, 'aria-selected')
        this.update({ item })
      })
    }
   },
  fns: [
    _ => !_.item,
    (_,e) => { _.router.del('id') }
  ]
}]
export default lib[0]