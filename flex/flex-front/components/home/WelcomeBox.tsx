import Link from 'next/link'

const WelcomeBox = () => {
  return (
    <div className="bg-gray-800 text-white p-10 rounded-lg shadow-xl text-center my-10">
      <h1 className="text-4xl font-bold mb-4">Üdvözlünk a Flex-ben!</h1>
      <p className="text-lg mb-6">
        Fedezd fel filmjeidet és sorozataidat egy helyen. Jelentkezz be a kezdéshez, vagy
        regisztrálj, ha új felhasználó vagy.
      </p>
      <div className="space-x-4">
        <Link
          href="/auth?login"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
        >
          Bejelentkezés
        </Link>
        <Link
          href="/auth?register"
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
        >
          Regisztráció
        </Link>
      </div>
    </div>
  )
}

export default WelcomeBox
