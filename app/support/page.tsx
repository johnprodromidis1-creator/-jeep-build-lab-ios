import {SupportContent} from '../components/privacy-content';
import Link from 'next/link';
export const metadata={title:'Support — Jeep Build Lab'};
export default function Support(){return <main className="policy-page"><Link href="/">← Back to builder</Link><h1>Support</h1><SupportContent/></main>;}
