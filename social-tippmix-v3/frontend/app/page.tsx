import Link from 'next/link'

export default function Home() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-primary">Üdvözlünk a Social Tippmixen!</h1>
          <p className="py-6 text-base-content">
            Tippelj a kedvenc meccseidre, mérkőzz meg a barátaiddal és kövesd nyomon az
            eredményeket! Készülj fel egy izgalmas szezonra!
          </p>
          <Link href="/matches" className="btn btn-primary mr-2">
            Aktuális Meccsek
          </Link>
          <Link
            href={{ pathname: '/auth', query: { mode: 'register' } }}
            className="btn btn-secondary"
          >
            Regisztráció
          </Link>
        </div>
      </div>
    </div>
  )
}
