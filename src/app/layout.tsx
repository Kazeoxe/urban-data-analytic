"use client"
import { Provider } from "../components/ui/provider";
import dynamic from 'next/dynamic'
import localFont from "next/font/local";
import "./globals.css";

const LoaderComponent = dynamic(() => import('../components/Loader'), {
  ssr: false,
})

const round8four = localFont({
  src: "../fonts/Round8four.woff",
  variable: "--font-round8four",
  weight: "100 900",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${round8four.variable} antialiased overflow-hidden`}>
        <Provider>
          <LoaderComponent />
          <div id="counter-container" className="text-[380px] fixed w-full h-full flex justify-end z-50 text-white py-1 px-2 pr-11 items-end overflow-hidden">
            <p className="counter font-round8four flex">0</p>
          </div>
          <div className="overlay fixed w-screen h-screen z-10 flex">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="w-[10vw] h-[105vh] bg-[red] bar" />
            ))}
          </div>
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  );

}