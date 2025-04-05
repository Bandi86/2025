
  import { model } from '../model/index.js'

export const lib = [
{
  name: 'login-screen',
  tagName: 'div',
  tmpl: '<div :class="0"> <form class="login ui card" @submit="1"> <header class> <img class="logo" src="/img/logo.png" width="40"> <h1>Demo Login</h1> </header> <label> <h3>Email</h3> <input name="email" type="email" autofocus value="demo.user@example.com" autocomplete="email"> </label> <label> <h3>Password</h3> <input name="password" type="password" value="password" autocomplete="current-password"> </label> <footer> <button class="primary">Log in</button> </footer> </form> </div>',
  Impl: class { 
    login({ target }) {
      this.loading = true
      model.login(target.email.value, target.password.value).then(function() {
        dispatchEvent(new Event('login'))

      }).catch(err => {
        this.update({ failure: true, loading: false })
      })
    }
   },
  fns: [
    _ => [_.loading && 'pulsating '],
    (_,e) => { {e.preventDefault();_.login.call(_, e)} }
  ]
}]
export default lib[0]