import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-black mb-4 italic transform -skew-x-6">JRNY</h1>
        <p className="text-xl mb-8">Marathon Training Companion</p>
        <Link 
          href="/dashboard"
          className="bg-white text-orange-500 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
