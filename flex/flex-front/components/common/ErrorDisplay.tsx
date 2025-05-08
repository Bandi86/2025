import Link from 'next/link'

interface ErrorDisplayProps {
  title: string
  message: string
  linkHref?: string
  linkText?: string
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ title, message, linkHref, linkText }) => {
  return (
    <div
      role="alert"
      className="alert alert-error my-10 max-w-lg mx-auto shadow-lg animate-entrance"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="stroke-current shrink-0 h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div>
        <h3 className="font-bold text-xl mb-1">{title}</h3>
        <div className="text-md">{message}</div>
      </div>
      {linkHref && linkText && (
        <Link href={linkHref} className="btn btn-sm btn-primary-focus">
          {linkText}
        </Link>
      )}
    </div>
  )
}

export default ErrorDisplay
