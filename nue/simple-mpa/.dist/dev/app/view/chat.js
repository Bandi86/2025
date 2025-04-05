
  import { formatDate, formatBody } from './util.js'

export const lib = [
{
  name: 'chat-thread',
  tagName: 'ul',
  tmpl: '<ul class="thread"> <li :for="0" :class="1"> <time :if="2">:3:</time> <div :class="4" :html="5"></div> </li> </ul>',
  Impl: class { 
    formatDate = formatDate
    formatBody = formatBody

    isEmoji(msg) {
      return !msg[3] && /\p{Emoji}/u.test(msg)
    }
   },
  fns: [
    _ => ['msg', _.thread, 'i'],
    _ => [_.msg.is_reply && 'reply ',' appears'],
    _ => _.msg.created,
    _ => [_.formatDate(_.msg.created)],
    _ => [_.isEmoji(_.msg.body) ? 'emoji' : 'post'],
    _ =>  _.formatBody(_.msg.body) 
  ]
},{
  name: 'chat-form',
  tagName: 'form',
  tmpl: '<form class="chat-form appears" @submit="0"> <textarea name="body" placeholder="Type your reply..." required @keydown="1"></textarea> <button><icon key="send-horizontal"></icon></button> </form>',
  Impl: class { 

    keydown(e) {
      if (e.key == 'Enter' && e.metaKey) {
        this.submit(e)
        e.preventDefault()
      }
    }

    submit(e) {
      const input = e.target.body || e.target
      const body = input.value

      if (body.trim()) {
        this.thread.reply(body)
        input.value = ''
        details_body.scrollTop = 100000
      }
    }
   },
  fns: [
    (_,e) => { {e.preventDefault();_.submit.call(_, e)} },
    (_,e) => { _.keydown.call(_, e) }
  ]
}]
export default lib[0]