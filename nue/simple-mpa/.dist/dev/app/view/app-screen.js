
  import { router } from '/@nue/app-router.js'

export const lib = [
{
  name: 'app',
  tagName: 'main',
  tmpl: '<main class="ui app"> <nav-panel class="panel nav-panel" :config></nav-panel> <content-panel class="panel content-panel card" :config></content-panel> <details-panel class="panel details-panel card"></details-panel> </main>',
  Impl: class { 
    mounted(args) {
      router.initialize({ root: this.root })
    }
   },
}]
export default lib[0]