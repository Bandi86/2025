import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

const Navbar = async () => {
  const menu = ["home", "about", "blog", "contact"];
  const session = await getServerSession(authOptions);

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-around gap-4 items-center">
      <ul className="flex space-x-4">
        {menu.map((item) => (
          <li key={item} className="capitalize">
            <Link href={`/${item}`}>{item}</Link>
          </li>
        ))}
      </ul>
      {!session ? (
        <div className="flex space-x-4 gap-4">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Placeholder for avatar menu */}
          <span>Welcome, {session.user?.name || session.user?.email}!</span>
          {/* TODO: Add avatar dropdown menu here */}
        </div>
      )}
    </nav>
  );
};

export default Navbar;