import Link from 'next/link'
import React from 'react'

const LeftMenu = () => {
  return (
    <aside className="w-56 bg-base-200 flex flex-col">
    <nav>
      <ul className="menu flex flex-col gap-8 items-center pt-6 text-lg justify-self-center">
        <li>
          <Link className="menu-active" href={'/'}>
            Főoldal
          </Link>
        </li>
        <li>
          <Link href={'/filmek'}>Filmek</Link>
        </li>
        <li>
          <Link href={'/sorozatok'}>Sorozatok</Link>
        </li>
      </ul>
    </nav>
  </aside>
  )
}

export default LeftMenu