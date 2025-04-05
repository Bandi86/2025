
  import { router } from '/@nue/app-router.js'

export const lib = [
{
  name: 'search-input',
  tagName: 'label',
  tmpl: '<label class="search" data-accesskey="/"> <icon key="search"></icon> <input :value="1" type="search" placeholder="Search..." @input="0" $autofocus="2"> <kbd><strong>&#x2318;</strong></kbd><kbd>K</kbd> </label>',
  Impl: class { 
    value = router.state.query

    search(e) {
      router.set({ type: 'search', query: e.target.value, start: null })
    }

   },
  fns: [
    (_,e) => { _.search.call(_, e) },
    _ => _.value,
    _ => _.value
  ]
}]
export default lib[0]