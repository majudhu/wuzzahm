import kv from '@vercel/kv';
import type { Session } from '@vercel/remix';
import { createKvSessionStorage, redirect } from '@vercel/remix';

const sessionStorage = createKvSessionStorage({
  cookie: 'kvsession',
  kv,
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get('Cookie'));
}

export async function commitSession(session: Session, redirectTo = '/') {
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge: 60 * 60 * 24 * 7, // 7 days,
      }),
    },
  });
}

export async function destroySession(request: Request, redirectTo = '/') {
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(
        await getSession(request)
      ),
    },
  });
}
