import {headers} from 'next/headers';
import Builder from './builder';
export const dynamic='force-dynamic';
export default async function Home(){const requestHeaders=await headers();return <Builder storageMode={requestHeaders.get('oai-authenticated-user-id')?'cloud':'device'}/>;}
