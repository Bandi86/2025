import RegularButton from './RegularButton'

const Form = ({ handleSubmit }: any) => {
  return (
    <form className="wrapper">
      <RegularButton handleClick={handleSubmit}>Start Game</RegularButton>
    </form>
  )
}

export default Form
