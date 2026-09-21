import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import { useLanguage } from '../context/LanguageContext';

export default function ListingItem({ listing }) {
  const { t } = useLanguage();
  const isGuestHouse =
    listing?.category === 'guesthouse' ||
    listing?.type === 'rent' ||
    (!listing?.category && !listing?.type);

  const fallbackImage = isGuestHouse
    ? '/images/airbnb_apartment_living.jpg'
    : '/images/city_regular_sedan.jpg';

  const regularPrice = Number(listing?.regularPrice || listing?.price) || 0;
  const discountPrice = Number(listing?.discountPrice) || 0;
  const title = listing?.title || listing?.name || 'Listing';
  const locationText = listing?.location || listing?.address || '';
  const seatsCount = listing?.seats || listing?.bedrooms || 4;

  return (
    <div className='group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out overflow-hidden w-full flex flex-col'>
      <Link to={`/listing/${listing._id}`} className='flex flex-col h-full'>
        <div className='relative h-[300px] sm:h-[220px] w-full overflow-hidden bg-slate-100'>
          <img
            src={
              listing.imageUrls && listing.imageUrls.length > 0
                ? listing.imageUrls[0]
                : fallbackImage
            }
            alt={listing.name || 'listing cover'}
            className='h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out'
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
          <div className='absolute top-3 left-3'>
            <span className='bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/10'>
              {isGuestHouse ? 'Guest House' : 'Chauffeur Car'}
            </span>
          </div>
          {listing.offer && (
            <div className='absolute top-3 right-3'>
              <span className='bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm'>
                OFFER
              </span>
            </div>
          )}
        </div>

        <div className='p-4 flex flex-col flex-1 gap-2 w-full'>
          <p className='truncate text-base sm:text-lg font-bold text-slate-800 group-hover:text-slate-950 transition-colors'>
            {title}
          </p>

          <div className='flex items-center gap-1.5'>
            <MdLocationOn className='h-4 w-4 text-emerald-600 shrink-0' />
            <p className='text-xs sm:text-sm text-slate-500 truncate w-full'>
              {locationText}
            </p>
          </div>

          <p className='text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed'>
            {listing.description}
          </p>

          <div className='mt-auto pt-2 border-t border-slate-100 flex items-center justify-between'>
            <p className='text-slate-900 font-extrabold text-base sm:text-lg'>
              $
              {listing.offer
                ? discountPrice.toLocaleString('en-US')
                : regularPrice.toLocaleString('en-US')}
              <span className='text-xs font-normal text-slate-500 ml-1'>
                {isGuestHouse ? t('listing.perNight') : t('listing.perDayDriver')}
              </span>
            </p>

            <div className='text-slate-600 flex items-center gap-2.5 text-xs font-semibold'>
              <span className='bg-slate-100 px-2 py-1 rounded-md'>
                {isGuestHouse
                  ? `${listing.bedrooms || 1} ${(listing.bedrooms || 1) > 1 ? t('listing.beds') : t('listing.bed')}`
                  : `${seatsCount} ${seatsCount > 1 ? t('listing.seats') : t('listing.seat')}`}
              </span>
              <span className='bg-slate-100 px-2 py-1 rounded-md'>
                {isGuestHouse
                  ? `${listing.bathrooms || 1} ${(listing.bathrooms || 1) > 1 ? t('listing.baths') : t('listing.bath')}`
                  : `${listing.driverIncluded !== false ? t('search.driverIncluded') : t('listing.car')}`}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
