import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Jeep Build Lab — Plan your next upgrade",description:"Build your Wrangler JL with real parts, an interactive preview, compatibility notes, and a running budget.",icons:{icon:"/favicon.svg"},manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
