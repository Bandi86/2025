import React from 'react'

const Container = ({children} : {children: React.ReactNode}) => {
  return (
    <div className='max-w-[1920px] w-full mx-auto'>{children}</div>
  )
}

export default Container