import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={
                    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-gradient mb-4">Project Pup</h1>
                            <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-6">
                                Welcome to your app! 🐕
                            </p>
                            <div className="flex gap-4 justify-center">
                                <a href="/login" className="px-6 py-2.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors">
                                    Login
                                </a>
                                <a href="/register" className="px-6 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    Register
                                </a>
                            </div>
                        </div>
                    </div>
                } />
            </Routes>
        </Router>
    );
}

export default App;
