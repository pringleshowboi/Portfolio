import Link from 'next/link';

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    return (
        <div className="min-h-screen bg-black text-green-400 font-mono p-10 flex flex-col items-start justify-center">
            <div className="border border-green-700 p-8 max-w-2xl w-full bg-gray-900/50">
                <h1 className="text-3xl font-bold text-yellow-400 mb-4 uppercase">
                    SERVICE_MODULE: {slug.replace(/-/g, '_')}
                </h1>
                
                <div className="space-y-4 text-sm md:text-base">
                    <p>
                        <span className="text-green-600">[STATUS]</span> ACCESS_GRANTED
                    </p>
                    <p>
                        <span className="text-green-600">[INFO]</span> This secure module is currently being compiled for presentation.
                    </p>
                    <p className="text-gray-400">
                        Detailed specifications for {slug.replace(/-/g, ' ')} will be available shortly.
                    </p>
                </div>

                <div className="mt-8 border-t border-green-800 pt-4">
                    <Link 
                        href="/"
                        className="inline-block px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors font-bold text-sm"
                    >
                        &lt; RETURN_TO_TERMINAL
                    </Link>
                </div>
            </div>
        </div>
    );
}
