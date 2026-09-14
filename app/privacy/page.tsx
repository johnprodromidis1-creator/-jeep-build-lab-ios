import {PrivacyContent} from '../components/privacy-content';
import Link from 'next/link';
export const metadata={title:'Privacy — Jeep Build Lab'};
export default function Privacy(){return <main className="policy-page"><Link href="/">← Back to builder</Link><h1>Privacy policy</h1><PrivacyContent/></main>;}
