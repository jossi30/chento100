import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';
import { useLanguage } from '../context/LanguageContext';

export default function Search() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    category: 'all', // 'all' | 'guesthouse' | 'car'
    // Guesthouse-specific filters
    bedrooms: '',
    bathrooms: '',
    maxGuests: '',
    wifi: false,
    kitchen: false,
    airConditioning: false,
    pool: false,
    // Car-specific filters
    transmission: 'all', // 'all' | 'automatic' | 'manual'
    driverIncluded: false,
    seats: '',
    // Sort
    sort: 'createdAt',
    order: 'desc',
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');

    // Parse category with legacy fallback (type=rent -> guesthouse, type=sale -> car)
    let categoryFromUrl = urlParams.get('category');
    if (!categoryFromUrl) {
      const typeFromUrl = urlParams.get('type');
      if (typeFromUrl === 'rent') categoryFromUrl = 'guesthouse';
      else if (typeFromUrl === 'sale') categoryFromUrl = 'car';
    }

    const bedroomsFromUrl = urlParams.get('bedrooms');
    const bathroomsFromUrl = urlParams.get('bathrooms');
    const maxGuestsFromUrl = urlParams.get('maxGuests');
    const wifiFromUrl = urlParams.get('wifi');
    const kitchenFromUrl = urlParams.get('kitchen');
    const airConditioningFromUrl = urlParams.get('airConditioning');
    const poolFromUrl = urlParams.get('pool');

    const transmissionFromUrl = urlParams.get('transmission');
    const driverIncludedFromUrl = urlParams.get('driverIncluded');
    const seatsFromUrl = urlParams.get('seats');

    const sortFromUrl = urlParams.get('sort');
    const orderFromUrl = urlParams.get('order');

    if (
      searchTermFromUrl !== null ||
      categoryFromUrl !== null ||
      bedroomsFromUrl !== null ||
      bathroomsFromUrl !== null ||
      maxGuestsFromUrl !== null ||
      wifiFromUrl !== null ||
      kitchenFromUrl !== null ||
      airConditioningFromUrl !== null ||
      poolFromUrl !== null ||
      transmissionFromUrl !== null ||
      driverIncludedFromUrl !== null ||
      seatsFromUrl !== null ||
      sortFromUrl !== null ||
      orderFromUrl !== null
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || '',
        category: categoryFromUrl || 'all',
        bedrooms: bedroomsFromUrl || '',
        bathrooms: bathroomsFromUrl || '',
        maxGuests: maxGuestsFromUrl || '',
        wifi: wifiFromUrl === 'true',
        kitchen: kitchenFromUrl === 'true',
        airConditioning: airConditioningFromUrl === 'true',
        pool: poolFromUrl === 'true',
        transmission: transmissionFromUrl || 'all',
        driverIncluded: driverIncludedFromUrl === 'true',
        seats: seatsFromUrl || '',
        sort: sortFromUrl || 'createdAt',
        order: orderFromUrl || 'desc',
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      const listingsData = Array.isArray(data) ? data : [];
      if (listingsData.length > 8) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
      setListings(listingsData);
      setLoading(false);
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    const { id, value, checked } = e.target;

    if (id === 'searchTerm') {
      setSidebardata({ ...sidebardata, searchTerm: value });
      return;
    }

    if (id === 'category_all') {
      setSidebardata({ ...sidebardata, category: 'all' });
      return;
    }
    if (id === 'category_guesthouse') {
      setSidebardata({ ...sidebardata, category: 'guesthouse' });
      return;
    }
    if (id === 'category_car') {
      setSidebardata({ ...sidebardata, category: 'car' });
      return;
    }

    // Guesthouse amenities checkboxes
    if (
      id === 'wifi' ||
      id === 'kitchen' ||
      id === 'airConditioning' ||
      id === 'pool'
    ) {
      setSidebardata({
        ...sidebardata,
        [id]: checked,
      });
      return;
    }

    // Car driverIncluded checkbox
    if (id === 'driverIncluded') {
      setSidebardata({
        ...sidebardata,
        driverIncluded: checked,
      });
      return;
    }

    // Guesthouse selects
    if (id === 'bedrooms' || id === 'bathrooms' || id === 'maxGuests') {
      setSidebardata({
        ...sidebardata,
        [id]: value,
      });
      return;
    }

    // Car selects
    if (id === 'transmission' || id === 'seats') {
      setSidebardata({
        ...sidebardata,
        [id]: value,
      });
      return;
    }

    // Sort order
    if (id === 'sort_order') {
      const parts = value.split('_');
      const sort = parts[0] === 'regularPrice' ? 'regularPrice' : 'createdAt';
      const order = parts[1] || 'desc';
      setSidebardata({ ...sidebardata, sort, order });
      return;
    }
  };

  const handleCategorySelect = (newCategory) => {
    setSidebardata((prev) => ({
      ...prev,
      category: newCategory,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();

    if (sidebardata.searchTerm) {
      urlParams.set('searchTerm', sidebardata.searchTerm);
    }

    if (sidebardata.category && sidebardata.category !== 'all') {
      urlParams.set('category', sidebardata.category);
    }

    // Guesthouse specific params
    if (sidebardata.category === 'guesthouse' || sidebardata.category === 'all') {
      if (sidebardata.bedrooms) urlParams.set('bedrooms', sidebardata.bedrooms);
      if (sidebardata.bathrooms) urlParams.set('bathrooms', sidebardata.bathrooms);
      if (sidebardata.maxGuests) urlParams.set('maxGuests', sidebardata.maxGuests);
      if (sidebardata.wifi) urlParams.set('wifi', 'true');
      if (sidebardata.kitchen) urlParams.set('kitchen', 'true');
      if (sidebardata.airConditioning) urlParams.set('airConditioning', 'true');
      if (sidebardata.pool) urlParams.set('pool', 'true');
    }

    // Car specific params
    if (sidebardata.category === 'car' || sidebardata.category === 'all') {
      if (sidebardata.transmission && sidebardata.transmission !== 'all') {
        urlParams.set('transmission', sidebardata.transmission);
      }
      if (sidebardata.driverIncluded) {
        urlParams.set('driverIncluded', 'true');
      }
      if (sidebardata.seats) {
        urlParams.set('seats', sidebardata.seats);
      }
    }

    urlParams.set('sort', sidebardata.sort);
    urlParams.set('order', sidebardata.order);

    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const handleReset = () => {
    setSidebardata({
      searchTerm: '',
      category: 'all',
      bedrooms: '',
      bathrooms: '',
      maxGuests: '',
      wifi: false,
      kitchen: false,
      airConditioning: false,
      pool: false,
      transmission: 'all',
      driverIncluded: false,
      seats: '',
      sort: 'createdAt',
      order: 'desc',
    });
    navigate('/search');
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/listing/get?${searchQuery}`);
    const data = await res.json();
    const moreListings = Array.isArray(data) ? data : [];
    if (moreListings.length < 9) {
      setShowMore(false);
    }
    setListings([...listings, ...moreListings]);
  };

  // Determine which filter sections to display
  const showGuesthouseFilters =
    sidebardata.category === 'guesthouse' || sidebardata.category === 'all';
  const showCarFilters =
    sidebardata.category === 'car' || sidebardata.category === 'all';

  return (
    <div className='max-w-7xl mx-auto flex flex-col md:flex-row gap-6 p-4 sm:p-6'>
      {/* Sidebar Filter Component */}
      <div className='p-6 rounded-3xl border border-slate-200/80 bg-white shadow-xs md:w-[350px] shrink-0 self-start md:sticky md:top-24 transition-all'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          {/* Search Term */}
          <div className='flex flex-col gap-2'>
            <label htmlFor='searchTerm' className='font-semibold text-slate-700'>
              {t('search.searchTerm')}
            </label>
            <input
              type='text'
              id='searchTerm'
              placeholder={t('search.searchPlaceholder')}
              className='border border-slate-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-slate-500'
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          {/* Category Filter */}
          <div className='flex flex-col gap-2'>
            <label className='font-semibold text-slate-700'>
              {t('search.category')}
            </label>
            <div className='flex gap-2 flex-wrap'>
              <label
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                  sidebardata.category === 'all'
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type='radio'
                  name='category'
                  id='category_all'
                  className='hidden'
                  checked={sidebardata.category === 'all'}
                  onChange={() => handleCategorySelect('all')}
                />
                <span>{t('search.all')}</span>
              </label>

              <label
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                  sidebardata.category === 'guesthouse'
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type='radio'
                  name='category'
                  id='category_guesthouse'
                  className='hidden'
                  checked={sidebardata.category === 'guesthouse'}
                  onChange={() => handleCategorySelect('guesthouse')}
                />
                <span>{t('search.guestHouse')}</span>
              </label>

              <label
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm font-medium transition-colors ${
                  sidebardata.category === 'car'
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type='radio'
                  name='category'
                  id='category_car'
                  className='hidden'
                  checked={sidebardata.category === 'car'}
                  onChange={() => handleCategorySelect('car')}
                />
                <span>{t('search.carWithDriver')}</span>
              </label>
            </div>
          </div>

          {/* Guest House Specific Options */}
          {showGuesthouseFilters && (
            <div className='border-t pt-5 flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-sm text-slate-800 uppercase tracking-wide'>
                  {t('search.guesthouseOptions')}
                </h3>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <label htmlFor='bedrooms' className='text-xs font-semibold text-slate-600'>
                    {t('search.bedrooms')}
                  </label>
                  <select
                    id='bedrooms'
                    value={sidebardata.bedrooms}
                    onChange={handleChange}
                    className='border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-500'
                  >
                    <option value=''>{t('search.any')}</option>
                    <option value='1'>1+ {t('listing.bed')}</option>
                    <option value='2'>2+ {t('listing.beds')}</option>
                    <option value='3'>3+ {t('listing.beds')}</option>
                    <option value='4'>4+ {t('listing.beds')}</option>
                  </select>
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label htmlFor='bathrooms' className='text-xs font-semibold text-slate-600'>
                    {t('search.bathrooms')}
                  </label>
                  <select
                    id='bathrooms'
                    value={sidebardata.bathrooms}
                    onChange={handleChange}
                    className='border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-500'
                  >
                    <option value=''>{t('search.any')}</option>
                    <option value='1'>1+ {t('listing.bath')}</option>
                    <option value='2'>2+ {t('listing.baths')}</option>
                    <option value='3'>3+ {t('listing.baths')}</option>
                  </select>
                </div>
              </div>

              {/* Max Guests */}
              <div className='flex flex-col gap-1.5'>
                <label htmlFor='maxGuests' className='text-xs font-semibold text-slate-600'>
                  {t('search.maxGuests')}
                </label>
                <select
                  id='maxGuests'
                  value={sidebardata.maxGuests}
                  onChange={handleChange}
                  className='border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-500'
                >
                  <option value=''>{t('search.any')}</option>
                  <option value='2'>2+ {t('search.maxGuests')}</option>
                  <option value='4'>4+ {t('search.maxGuests')}</option>
                  <option value='6'>6+ {t('search.maxGuests')}</option>
                  <option value='8'>8+ {t('search.maxGuests')}</option>
                </select>
              </div>

              {/* Amenities */}
              <div className='flex flex-col gap-2'>
                <span className='text-xs font-semibold text-slate-600'>
                  {t('search.amenities')}
                </span>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <label className='flex items-center gap-2 cursor-pointer text-slate-700'>
                    <input
                      type='checkbox'
                      id='wifi'
                      className='w-4 h-4 rounded text-slate-700'
                      onChange={handleChange}
                      checked={sidebardata.wifi}
                    />
                    <span>{t('search.wifi')}</span>
                  </label>

                  <label className='flex items-center gap-2 cursor-pointer text-slate-700'>
                    <input
                      type='checkbox'
                      id='kitchen'
                      className='w-4 h-4 rounded text-slate-700'
                      onChange={handleChange}
                      checked={sidebardata.kitchen}
                    />
                    <span>{t('search.kitchen')}</span>
                  </label>

                  <label className='flex items-center gap-2 cursor-pointer text-slate-700'>
                    <input
                      type='checkbox'
                      id='airConditioning'
                      className='w-4 h-4 rounded text-slate-700'
                      onChange={handleChange}
                      checked={sidebardata.airConditioning}
                    />
                    <span>{t('search.airConditioning')}</span>
                  </label>

                  <label className='flex items-center gap-2 cursor-pointer text-slate-700'>
                    <input
                      type='checkbox'
                      id='pool'
                      className='w-4 h-4 rounded text-slate-700'
                      onChange={handleChange}
                      checked={sidebardata.pool}
                    />
                    <span>{t('search.pool')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Car Specific Options */}
          {showCarFilters && (
            <div className='border-t pt-5 flex flex-col gap-4'>
              <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-sm text-slate-800 uppercase tracking-wide'>
                  {t('search.carOptions')}
                </h3>
              </div>

              {/* Driver Included */}
              <label className='flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors'>
                <input
                  type='checkbox'
                  id='driverIncluded'
                  className='w-4 h-4 rounded text-slate-700'
                  onChange={handleChange}
                  checked={sidebardata.driverIncluded}
                />
                <span className='text-sm font-medium text-slate-800'>
                  {t('search.driverIncluded')}
                </span>
              </label>

              {/* Transmission & Seats */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <label htmlFor='transmission' className='text-xs font-semibold text-slate-600'>
                    {t('search.transmission')}
                  </label>
                  <select
                    id='transmission'
                    value={sidebardata.transmission}
                    onChange={handleChange}
                    className='border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-500'
                  >
                    <option value='all'>{t('search.any')}</option>
                    <option value='automatic'>{t('search.automatic')}</option>
                    <option value='manual'>{t('search.manual')}</option>
                  </select>
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label htmlFor='seats' className='text-xs font-semibold text-slate-600'>
                    {t('search.seats')}
                  </label>
                  <select
                    id='seats'
                    value={sidebardata.seats}
                    onChange={handleChange}
                    className='border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-500'
                  >
                    <option value=''>{t('search.any')}</option>
                    <option value='2'>2+ {t('listing.seats')}</option>
                    <option value='4'>4+ {t('listing.seats')}</option>
                    <option value='5'>5+ {t('listing.seats')}</option>
                    <option value='7'>7+ {t('listing.seats')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sort Options (price, latest/oldest stay the same) */}
          <div className='border-t pt-5 flex flex-col gap-2'>
            <label htmlFor='sort_order' className='font-semibold text-slate-700'>
              {t('search.sort')}
            </label>
            <select
              onChange={handleChange}
              value={
                sidebardata.sort === 'regularPrice'
                  ? `regularPrice_${sidebardata.order}`
                  : `createdAt_${sidebardata.order}`
              }
              id='sort_order'
              className='border border-slate-300 rounded-lg p-3 w-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm'
            >
              <option value='regularPrice_desc'>{t('search.priceHighLow')}</option>
              <option value='regularPrice_asc'>{t('search.priceLowHigh')}</option>
              <option value='createdAt_desc'>{t('search.latest')}</option>
              <option value='createdAt_asc'>{t('search.oldest')}</option>
            </select>
          </div>

          {/* Search and Reset Buttons */}
          <div className='flex flex-col gap-2.5 pt-2'>
            <button
              type='submit'
              className='bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white p-3.5 rounded-xl uppercase font-bold text-xs tracking-wider transition-all duration-200 shadow-xs cursor-pointer'
            >
              {t('search.searchButton')}
            </button>
            <button
              type='button'
              onClick={handleReset}
              className='border border-slate-300 text-slate-700 p-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 hover:border-slate-400 active:scale-[0.99] transition-all duration-200 text-center cursor-pointer'
            >
              {t('search.resetFilters')}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div className='flex-1 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs'>
        <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
          <h1 className='text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight'>
            {t('search.resultsTitle')}
          </h1>
          {!loading && (
            <span className='text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full'>
              {listings.length} {listings.length === 1 ? 'place' : 'places'} found
            </span>
          )}
        </div>

        <div className='py-6'>
          {!loading && listings.length === 0 && (
            <div className='text-center py-16 flex flex-col items-center justify-center gap-2'>
              <p className='text-base font-semibold text-slate-700'>{t('search.noResults')}</p>
              <p className='text-xs text-slate-400'>Try adjusting your keywords or category filters.</p>
            </div>
          )}
          {loading && (
            <div className='text-center py-16 flex flex-col items-center justify-center gap-2'>
              <div className='w-8 h-8 rounded-full border-3 border-slate-300 border-t-slate-800 animate-spin'></div>
              <p className='text-xs font-medium text-slate-500 mt-2'>{t('search.loading')}</p>
            </div>
          )}

          {!loading && listings && listings.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7'>
              {listings.map((listing) => (
                <ListingItem key={listing._id} listing={listing} />
              ))}
            </div>
          )}

          {showMore && (
            <button
              onClick={onShowMoreClick}
              className='text-slate-700 hover:text-slate-950 font-semibold p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-98 transition-all duration-200 text-center w-full mt-6 text-xs uppercase tracking-wider cursor-pointer'
            >
              {t('search.showMore')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
