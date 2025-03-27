const RegularButton = ({ children, handleClick }: any) => {
  return (
    <button className="btn btn--text" onClick={handleClick}>
      {children}
    </button>
  )
}

export default RegularButton
