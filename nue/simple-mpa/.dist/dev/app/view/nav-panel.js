
  import { loadPage } from '/@nue/view-transitions.js'
  import { router } from '/@nue/app-router.js'
  import { setSelected } from './util.js'
  import { model } from '../model/index.js'

export const lib = [
{
  name: 'nav-panel',
  tagName: 'aside',
  tmpl: '<aside :aria-visible="0"> <header> <img src="/img/logomark.webp" width="60" height="23"> <button class="ghost mobile" data-accesskey="Escape" title="Close" @click="1"> <icon key="x"></icon></button> </header> <section> <search-input></search-input> <nav> <a :for="2" :data-accesskey="4" :title="5" :href="3"> <icon :key="6"></icon>:7:</a> </nav> <details name="plans"> <summary @click="8">Plans</summary> <nav> <a :for="9" :href="10" :class="11"><icon key="dot"></icon>:12:</a> </nav> </details> <details name="sizes"> <summary @click="13">Company size</summary> <nav> <a :for="14" :href="15" :class="16"> <icon key="square"></icon>:17:</a> </nav> </details> </section> <footer> <media :title="18" :image="19"> <p><a class="action" @click="20">Logout</a></p> </media> </footer> </aside>',
  Impl: class { 
    user = model.user || {}
    router = router

    toggleDetails(key) {
      router.toggle(key + '_opened')
    }

    mounted() {
      router.bind('type filter', (data, { path }) => {
        setSelected(`a[href$="${path}"]`, 'aria-current', 'page')
      })

      router.bind('nav_opened', this.update)

      /*
        "open" attribute binding is problematic so we set initial states manually
        Same problem in React too: //github.com/facebook/react/issues/15486
      */
      const { plans, sizes } = this.$refs
      plans.open = !router.state.plans_opened
      sizes.open = !router.state.sizes_opened
    }

    logout() {
      router.cleanup()
      model.logout()
      loadPage('/')
    }
   },
  fns: [
    _ => _.router.state.nav_opened,
    (_,e) => { _.router.del('nav_opened') },
    _ => ['el', _.config.views, 'i'],
    _ => ['/app/',_.el.type,_.el.type ? '/' : ''],
    _ => _.i + 1,
    _ => _.el.title,
    _ => _.el.icon || _.el.type,
    _ => [_.el.title],
    (_,e) => { _.toggleDetails('plans') },
    _ => [['plan','label'], Object.entries(_.config.plans), '$index', true],
    _ => ['/app/plan/',_.plan],
    _ => ['plan-',_.plan],
    _ => [_.label],
    (_,e) => { _.toggleDetails('sizes') },
    _ => [['size','label'], Object.entries(_.config.company_sizes), '$index', true],
    _ => ['/app/size/',_.size],
    _ => ['size-',_.size],
    _ => [' ',_.label],
    _ => _.user.name,
    _ => _.user.avatar,
    (_,e) => { _.logout.call(_, e) }
  ]
}]
export default lib[0]