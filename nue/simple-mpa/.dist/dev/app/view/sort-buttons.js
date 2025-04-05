
  import { router } from '/@nue/app-router.js'

export const lib = [
{
  name: 'sort-buttons',
  tagName: 'nav',
  tmpl: '<nav class="flex"> <button :for="0" class="plain" @click="1" :aria-pressed="2" :title="3">:4:<icon :key="5"></icon> </button> </nav>',
  Impl: class { 
    state = router.state

    buttons = [
      { key: 'id', label: 'Created', is_default: true  },
      { key: 'cc', label: 'Country' },
      { key: 'size', label: 'Company size' },
      { key: 'plan', label: 'Plan' }
    ]

    getIcon(button) {
      const { sort, asc } = router.state
      if (button.key == sort || !sort && button.is_default) {
        return asc ? 'chevron-up' : 'chevron-down'
      }
      return 'chevrons-up-down'
    }

    sort(by) {
      router.set({ sort: by, asc: by == router.state.sort ? !router.state.asc : null})
    }
   },
  fns: [
    _ => ['button', _.buttons, '$index'],
    (_,e) => { _.sort(_.button.key) },
    _ => [!_.state.sort && _.button.is_default || _.state.sort == _.button.key],
    _ => ['Sort by ',_.button.label.toLowerCase()],
    _ => [' ',_.button.label,' '],
    _ => [_.getIcon(_.button)]
  ]
}]
export default lib[0]