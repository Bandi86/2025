import Link from 'next/link'

const ProfilePage = () => {
  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="text-sm breadcrumbs mb-6 animate-slide-up">
        <ul>
          <li>
            <Link href="/" className="opacity-60">
              Főoldal
            </Link>
          </li>
          <li className="font-medium">Profil</li>
        </ul>
      </div>

      <h1 className="text-3xl font-bold mb-8 font-poppins">Profilom</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Megtekintett filmek kártya */}
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out card-hover animate-entrance">
          <div className="card-body">
            <h2 className="card-title font-poppins">Megtekintett Filmek</h2>
            <p>Itt találod azokat a filmeket, amiket már megjelöltél megtekintettként.</p>
            <div className="card-actions justify-end mt-4">
              <Link href="/profil/megtekintett-filmek" className="btn btn-primary">
                Megtekintett Filmek Megnyitása
              </Link>
            </div>
          </div>
        </div>

        {/* Ide jöhetnek további profilhoz kapcsolódó kártyák, pl.: */}
        {/*
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out card-hover animate-entrance" style={{ animationDelay: '0.1s' }}>
          <div className="card-body">
            <h2 className="card-title font-poppins">Beállítások</h2>
            <p>Fiókbeállítások, értesítések és egyéb preferenciák.</p>
            <div className="card-actions justify-end mt-4">
              <Link href="/profil/beallitasok" className="btn btn-outline">
                Beállítások
              </Link>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 ease-in-out card-hover animate-entrance" style={{ animationDelay: '0.2s' }}>
          <div className="card-body">
            <h2 className="card-title font-poppins">Kedvencek</h2>
            <p>Filmek, amiket kedvencként jelöltél meg.</p>
            <div className="card-actions justify-end mt-4">
              <Link href="/profil/kedvencek" className="btn btn-outline">
                Kedvencek Megnyitása
              </Link>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  )
}

export default ProfilePage
