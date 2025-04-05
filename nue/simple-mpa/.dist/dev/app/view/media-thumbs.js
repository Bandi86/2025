
  import { router } from '/@nue/app-router.js'
  import { onDialogClose } from './util.js'

export const lib = [
{
  name: 'media-thumbs',
  tagName: 'div',
  tmpl: '<div> <ul class="media-thumbs"> <li :for="0"> <button @click="1"><img :src="2"></button> </li> </ul> <dialog id="media"></dialog> </div>',
  Impl: class { 
    open(i) {
      router.set({ shot: i + 1})
    }

    constructor() {
      router.bind('shot', args => {
        const index = args.shot
        if (index && !media.checkVisibility()) {
          this.mountChild('media-overlay', media, { index })
          onDialogClose(media, () => router.set({ shot: null }))
          media.showPopover()
        }
      })
    }
   },
  fns: [
    _ => ['name', _.items, 'i'],
    (_,e) => { _.open(_.i) },
    _ => ['/app/img/',_.name]
  ]
},{
  name: 'media-overlay',
  tagName: 'dialog',
  tmpl: '<dialog class="media-overlay" popover id="media"> <header> <h2>Screenshots</h2> <button class="ghost" popovertarget="media"><icon key="x"></icon></button> </header> <figure> <img :src="0"> </figure> <aside> <ul class="media-thumbs"> <li :for="1"> <button @click="2"> <img :src="3"> </button> </li> </ul> </aside> </dialog>',
  Impl: class { 
    state = router.state

    seek(i) {
      this.shot = this.items[i]
      this.open(i)
    }

    constructor({ items, index }) {
      this.shot = items[index -1]
      this.items = items
    }
   },
  fns: [
    _ => ['/app/img/',_.shot],
    _ => ['name', _.items, 'i'],
    (_,e) => { _.seek(_.i) },
    _ => ['/app/img/',_.name]
  ]
}]
export default lib[0]