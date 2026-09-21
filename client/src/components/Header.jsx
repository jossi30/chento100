import { FaSearch, FaGlobe } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const { t, toggleLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);
  return (
    <header className='sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-slate-200/80 shadow-xs transition-all duration-300'>
      <div className='flex justify-between items-center max-w-6xl mx-auto px-4 py-3'>
        <Link to='/' className='group flex items-center transition-transform duration-200 active:scale-95'>
          <h1 className='font-bold text-sm sm:text-xl tracking-tight flex flex-wrap items-center'>
            <span className='text-slate-500 group-hover:text-slate-600 transition-colors'>chento</span>
            <span className='text-slate-800 group-hover:text-slate-950 transition-colors font-extrabold'>&nbsp;100</span>
          </h1>
        </Link>

        <form
          onSubmit={handleSubmit}
          className='bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-200 px-3.5 py-1.5 sm:py-2 rounded-full flex items-center gap-2 transition-all duration-200 shadow-2xs'
        >
          <input
            type='text'
            placeholder={t('header.searchPlaceholder')}
            className='bg-transparent focus:outline-hidden text-xs sm:text-sm text-slate-800 placeholder-slate-400 w-24 sm:w-60 transition-all'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button aria-label='Search' className='text-slate-500 hover:text-slate-800 transition-transform active:scale-90 p-0.5'>
            <FaSearch className='text-xs sm:text-sm' />
          </button>
        </form>

        <ul className='flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium'>
          <Link to='/'>
            <li className='hidden sm:inline text-slate-600 hover:text-slate-900 transition-colors py-1'>
              {t('header.home')}
            </li>
          </Link>
          <Link to='/about'>
            <li className='hidden sm:inline text-slate-600 hover:text-slate-900 transition-colors py-1'>
              {t('header.about')}
            </li>
          </Link>
          {(Boolean(currentUser?.isAdmin) ||
            currentUser?.role === 'admin' ||
            (typeof currentUser?.email === 'string' &&
              (currentUser.email.toLowerCase() === 'jossvision11@gmail.com' ||
                currentUser.email.toLowerCase() === 'admin@chento100.com' ||
                currentUser.email.toLowerCase().includes('admin')))) && (
            <Link to='/admin-dashboard'>
              <li className='flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 hover:bg-slate-800 transition-all shadow-xs active:scale-95'>
                <span>Admin</span>
              </li>
            </Link>
          )}
          <button
            type='button'
            onClick={toggleLanguage}
            title={t('header.langTitle')}
            className='flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all shadow-2xs active:scale-95'
          >
            <FaGlobe className='text-slate-500' />
            <span>{t('header.langToggle')}</span>
          </button>
          <Link to='/profile' className='flex items-center'>
            {currentUser ? (
              <img
                className='rounded-full h-8 w-8 object-cover border border-slate-200 ring-2 ring-transparent hover:ring-slate-400 transition-all duration-200'
                src={currentUser.avatar}
                alt='profile'
              />
            ) : (
              <li className='text-slate-700 hover:text-slate-900 font-semibold transition-colors'>
                {t('header.signIn')}
              </li>
            )}
          </Link>
        </ul>
      </div>
    </header>
  );
}
