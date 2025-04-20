import { NextRequest, NextResponse } from 'next/server';

import RegisterHandler from '@/lib/register';
import LoginHandler from '@/lib/login';
import LogoutHandler from '@/lib/logout';

export async function POST(req: NextRequest) {
  const { action, ...data } = await req.json();

  try {
    switch (action) {
      case 'register':
        return new Promise((resolve) => {
          RegisterHandler(
            req as any,
            {
              status: (code: number) => ({
                json: (data: any) => resolve(NextResponse.json(data, { status: code })),
              }),
              setHeader: () => {},
            } as any,
            data
          );
        });
      case 'login':
        return new Promise((resolve) => {
          LoginHandler(
            req as any,
            {
              status: (code: number) => ({
                json: (data: any) => resolve(NextResponse.json(data, { status: code })),
              }),
              setHeader: (key: string, value: string) => {},
            } as any
          );
        });
      case 'logout':
        return new Promise((resolve) =>
          LogoutHandler(
            req as any,
            {
              status: (code: number) => ({
                json: (data: any) => resolve(NextResponse.json(data, { status: code })),
              }),
              setHeader: (key: string, value: string) => {},
            } as any
          )
        );
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
