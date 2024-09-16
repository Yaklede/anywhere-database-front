import Link from 'next/link';
import { FC } from 'react';

const Home: FC = () => {
    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Welcome to the SQL Query App</h1>
            <p>This is a simple Next.js application where you can run SQL queries.</p>
            <Link href="/connect">
                <a style={{ padding: '10px 20px', background: '#0070f3', color: 'white', borderRadius: '5px' }}>
                    Go to SQL Editor
                </a>
            </Link>
        </div>

    );
};

export default Home;
