'use client'
import { useSearchParams } from 'next/navigation'
import RegisterForm from '../../components/auth/RegisterForm'
import LoginForm from '../../components/auth/LoginForm'

export default function AuthPage() {
  const params = useSearchParams()
  const isRegister = params.get('register') !== null
  const isLogin = params.get('login') !== null

  return (
    <div>
      {isRegister && <RegisterForm />}
      {isLogin && <LoginForm />}
      {/* Opcionális: ha egyik sem, mutass választót */}
      {!isRegister && !isLogin && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = '/auth/?login')}
          >
            Bejelentkezés
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => (window.location.href = '/auth/?register')}
          >
            Regisztráció
          </button>
        </div>
      )}
    </div>
  )
}
