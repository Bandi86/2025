import React from 'react'
import Container from './Container'

const Navbar = () => {

    const navList = ['Home', 'About', 'Contact']

  return (
    <nav className='bg-black h-14 items-center text-white flex sticky top-0 border-b-2 z-50 border-white'>
        <Container>
        <ul className='flex gap-4 items-center w-full'>
            <div className='flex gap-4 items-center w-full justify-around'>
            <li className='cursor-pointer'>Logo</li>
            {navList.map(item => (
                <li className='cursor-pointer hover:text-red-500'>{item}</li>
            ))}
            </div>
            <div className='flex gap-12 items-center w-full justify-end mr-6'>
            <li>Search</li>
            <li>Notifications</li>
            <li>UserMenu</li>

            </div>
        </ul>
        </Container>
    </nav>
  )
}

export default Navbar