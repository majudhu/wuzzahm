import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import kv from '@vercel/kv';
import type { ActionArgs, LoaderArgs, V2_MetaFunction } from '@vercel/remix';
import { json } from '@vercel/remix';
import { useState } from 'react';
import { commitSession, destroySession, getSession } from '~/session.server';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'New Remix App' }];
};

export async function loader({ request }: LoaderArgs) {
  const session = await getSession(request);
  const name = session.get('name');
  return json({ name });
}

export default function Index() {
  const { name } = useLoaderData<typeof loader>();
  const error = useActionData<typeof action>() as string;
  const { state } = useNavigation();

  const [showError, setShowError] = useState(true);

  if (!showError && state == 'submitting') {
    setShowError(true);
  }

  return (
    <Form
      method='post'
      className='flex flex-col min-h-screen p-16 items-center justify-center gap-4'
    >
      {name ? (
        <p>welcome, {name}</p>
      ) : (
        <>
          <label className='text-center' htmlFor='name'>
            Name:
          </label>
          <input
            className='text-center border rounded p-1'
            id='name'
            name='name'
            onFocus={() => setShowError(false)}
          />
        </>
      )}

      {name && (
        <>
          <label className='text-center' htmlFor='password'>
            Old Password:
          </label>
          <input
            className='text-center border rounded p-1'
            id='old_password'
            name='old_password'
            type='password'
          />
        </>
      )}

      <label className='text-center' htmlFor='password'>
        {name && 'New'} Password:
      </label>
      <input
        className='text-center border rounded p-1'
        id='password'
        name='password'
        type='password'
        onFocus={() => setShowError(false)}
      />

      <button
        disabled={state !== 'idle'}
        type='submit'
        className='bg-teal-800 text-white px-4 py-1 rounded disabled:opacity-50'
      >
        {name ? 'Change' : 'Login'}
      </button>

      {name && (
        <button
          type='submit'
          formMethod='delete'
          className='bg-teal-800 text-white px-4 py-1 rounded'
        >
          Logout
        </button>
      )}

      {error && showError && state === 'idle' && (
        <p className='text-red-500 text-center'>
          {error}
          <br />
          <button name='reset'>reset</button>
        </p>
      )}
    </Form>
  );
}

export async function action({ request }: ActionArgs) {
  if (request.method === 'DELETE') {
    return destroySession(request);
  }

  const form = await request.formData();

  if (form.has('reset')) {
    await kv.set('test', '1234');
    return '';
  }

  const session = await getSession(request);
  const name = form.get('name') as string;
  const password = form.get('password') as string;
  const oldPassword = form.get('old_password') as string;

  if (oldPassword && session.has('name')) {
    const name = session.get('name');
    if (oldPassword == (await kv.get(name))) {
      await kv.set(name, password);
      return '';
    } else {
      return 'Invalid password';
    }
  }

  if (password == (await kv.get(name))) {
    session.set('name', name);
    return commitSession(session);
  } else {
    return 'Invalid password';
  }
}
