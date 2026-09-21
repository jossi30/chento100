import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  SwiperCore.use([Navigation]);
  useEffect(() => {
    const fetchOfferListings = async () => {
      try {
        const res = await fetch('/api/listing/get?offer=true&limit=4');
        const data = await res.json();
        setOfferListings(Array.isArray(data) ? data : []);
        fetchRentListings();
      } catch (error) {
        console.log(error);
      }
    };
    const fetchRentListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=rent&limit=4');
        const data = await res.json();
        setRentListings(Array.isArray(data) ? data : []);
        fetchSaleListings();
      } catch (error) {
        console.log(error);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch('/api/listing/get?type=sale&limit=4');
        const data = await res.json();
        setSaleListings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.log(error);
      }
    };
    fetchOfferListings();
  }, []);
  return (
    <div className='flex flex-col gap-6'>
      {/* top hero */}
      <div className='flex flex-col gap-6 py-16 sm:py-24 px-4 max-w-6xl mx-auto w-full'>
        <div className='inline-flex items-center gap-2 self-start bg-slate-200/70 backdrop-blur-xs text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300/60'>
          <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse'></span>
          <span>Chento 100 Premium Rentals & Stays</span>
        </div>

        <h1 className='text-slate-800 font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight sm:leading-tight'>
          {t('home.heroTitle1')} <span className='text-slate-500'>{t('home.heroTitleHighlight')}</span>
          <br />
          {t('home.heroTitle2')}
        </h1>

        <p className='text-slate-500 text-xs sm:text-sm sm:max-w-2xl leading-relaxed'>
          {t('home.heroSubtitle1')}&nbsp;{t('home.heroSubtitle2')}
        </p>

        <div>
          <Link
            to={'/search'}
            className='inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-700 transition-all duration-200 group'
          >
            <span>{t('home.startLink')}</span>
            <span className='transform group-hover:translate-x-1 transition-transform duration-200'>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* swiper hero banner */}
      <div className='max-w-6xl mx-auto w-full px-3 sm:px-4'>
        <div className='rounded-3xl overflow-hidden shadow-lg border border-slate-200/80'>
          <Swiper navigation className='rounded-3xl'>
            {offerListings &&
              offerListings.length > 0 &&
              offerListings.map((listing) => {
                const isGuestHouse =
                  listing.category === 'guesthouse' || listing.type === 'rent';
                const bgImage =
                  (listing.imageUrls && listing.imageUrls[0]) ||
                  (isGuestHouse
                    ? '/images/airbnb_apartment_living.jpg'
                    : '/images/city_regular_sedan.jpg');

                return (
                  <SwiperSlide key={listing._id}>
                    <Link to={`/listing/${listing._id}`} className='block group'>
                      <div
                        style={{
                          background: `url(${bgImage}) center no-repeat`,
                          backgroundSize: 'cover',
                        }}
                        className='h-[440px] sm:h-[500px] relative cursor-pointer overflow-hidden'
                      >
                        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 flex items-end p-6 sm:p-10 transition-opacity duration-300'>
                          <div className='bg-slate-950/65 backdrop-blur-md text-white p-5 sm:p-6 rounded-2xl max-w-xl border border-white/15 shadow-xl group-hover:bg-slate-950/80 transition-all duration-300'>
                            <span className='text-[11px] uppercase tracking-wider font-bold text-emerald-400'>
                              {isGuestHouse ? 'Apartment Guest House' : 'City Car & Private Driver'}
                            </span>
                            <h3 className='text-xl sm:text-2xl font-bold mt-1.5 text-white tracking-tight'>
                              {listing.title || listing.name}
                            </h3>
                            <p className='text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1'>
                              {listing.location || listing.address}
                            </p>
                            <p className='text-xs sm:text-sm font-semibold text-emerald-400 mt-2'>
                              ${(listing.offer ? listing.discountPrice : listing.regularPrice).toLocaleString('en-US')}
                              <span className='text-xs text-slate-300 font-normal ml-1'>
                                {isGuestHouse ? t('listing.perNight') : t('listing.perDayDriver')}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
          </Swiper>
        </div>
      </div>

      {/* listing results for offer, sale and rent */}
      <div className='max-w-6xl mx-auto p-4 flex flex-col gap-12 my-8 w-full'>
        {offerListings && offerListings.length > 0 && (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-2 border-b border-slate-200'>
              <div>
                <h2 className='text-xl sm:text-2xl font-bold text-slate-800 tracking-tight'>
                  {t('home.recentOffers')}
                </h2>
                <p className='text-xs text-slate-500 mt-0.5'>Hand-picked exclusive seasonal discounts</p>
              </div>
              <Link
                className='text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors inline-flex items-center gap-1 group'
                to={'/search?offer=true'}
              >
                <span>{t('home.showMoreOffers')}</span>
                <span className='group-hover:translate-x-0.5 transition-transform'>&rarr;</span>
              </Link>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {rentListings && rentListings.length > 0 && (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-2 border-b border-slate-200'>
              <div>
                <h2 className='text-xl sm:text-2xl font-bold text-slate-800 tracking-tight'>
                  {t('home.recentGuestHouses')}
                </h2>
                <p className='text-xs text-slate-500 mt-0.5'>Cozy, fully-furnished Airbnb-style apartments</p>
              </div>
              <Link
                className='text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors inline-flex items-center gap-1 group'
                to={'/search?type=rent'}
              >
                <span>{t('home.showMoreGuestHouses')}</span>
                <span className='group-hover:translate-x-0.5 transition-transform'>&rarr;</span>
              </Link>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {saleListings && saleListings.length > 0 && (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-2 border-b border-slate-200'>
              <div>
                <h2 className='text-xl sm:text-2xl font-bold text-slate-800 tracking-tight'>
                  {t('home.recentCarsDriver')}
                </h2>
                <p className='text-xs text-slate-500 mt-0.5'>Reliable city vehicles with professional chauffeurs</p>
              </div>
              <Link
                className='text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 transition-colors inline-flex items-center gap-1 group'
                to={'/search?type=sale'}
              >
                <span>{t('home.showMoreCarsDriver')}</span>
                <span className='group-hover:translate-x-0.5 transition-transform'>&rarr;</span>
              </Link>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
