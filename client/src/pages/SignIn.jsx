import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from '../redux/user/userSlice';
import OAuth from '../components/OAuth';
import { useLanguage } from '../context/LanguageContext';

export default function SignIn() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({});
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log(data);
      if (data.success === false) {
        dispatch(signInFailure(data.message));
        return;
      }
      dispatch(signInSuccess(data));
      navigate('/');
    } catch (error) {
      dispatch(signInFailure(error.message));
    }
  };
  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl text-center font-semibold my-7'>{t('signin.title')}</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='email'
          placeholder={t('signin.emailPlaceholder')}
          className='border p-3 rounded-lg'
          id='email'
          onChange={handleChange}
        />
        <input
          type='password'
          placeholder={t('signin.passwordPlaceholder')}
          className='border p-3 rounded-lg'
          id='password'
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? t('signin.loading') : t('signin.submitButton')}
        </button>
        <div className='flex flex-col sm:flex-row gap-2'>
          <button
            type='button'
            onClick={() => {
              const emailInput = document.getElementById('email');
              const passInput = document.getElementById('password');
              if (emailInput) emailInput.value = 'sahand@example.com';
              if (passInput) passInput.value = 'password123';
              setFormData({ email: 'sahand@example.com', password: 'password123' });
            }}
            className='flex-1 bg-emerald-600 text-white p-2.5 rounded-lg uppercase hover:opacity-95 text-xs font-semibold'
          >
            {t('signin.demoAccount')}
          </button>
          <button
            type='button'
            onClick={() => {
              const emailInput = document.getElementById('email');
              const passInput = document.getElementById('password');
              if (emailInput) emailInput.value = 'admin@chento100.com';
              if (passInput) passInput.value = 'password123';
              setFormData({ email: 'admin@chento100.com', password: 'password123' });
            }}
            className='flex-1 bg-slate-900 text-amber-300 p-2.5 rounded-lg uppercase hover:bg-slate-800 text-xs font-bold border border-slate-700'
          >
            Fill Demo Admin
          </button>
        </div>
        <OAuth/>
      </form>
      <div className='flex gap-2 mt-5'>
        <p>{t('signin.noAccount')}</p>
        <Link to={'/sign-up'}>
          <span className='text-blue-700'>{t('signin.signUpLink')}</span>
        </Link>
      </div>
      {error && <p className='text-red-500 mt-5'>{error}</p>}
    </div>
  );
}
