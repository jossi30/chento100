import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore from 'swiper';
import { useSelector } from 'react-redux';
import { Navigation } from 'swiper/modules';
import 'swiper/css/bundle';
import {
  FaBath,
  FaBed,
  FaCar,
  FaDoorOpen,
  FaMapMarkerAlt,
  FaParking,
  FaShare,
  FaShieldAlt,
  FaUserTie,
  FaWifi,
  FaCommentDots,
  FaWhatsapp,
  FaEnvelope,
  FaPhoneAlt,
} from 'react-icons/fa';
import Contact from '../components/Contact';
import EnquireModal from '../components/EnquireModal';
import { useLanguage } from '../context/LanguageContext';

// https://sabe.io/blog/javascript-format-numbers-commas#:~:text=The%20best%20way%20to%20format,format%20the%20number%20with%20commas.

export default function Listing() {
  const { t } = useLanguage();
  SwiperCore.use([Navigation]);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contact, setContact] = useState(false);
  const [enquireModalOpen, setEnquireModalOpen] = useState(false);
  const params = useParams();
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/listing/get/${params.listingId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }
        setListing(data);
        setLoading(false);
        setError(false);
      } catch (error) {
        setError(true);
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.listingId]);

  return (
    <main>
      {loading && <p className='text-center my-7 text-2xl'>Loading...</p>}
      {error && (
        <p className='text-center my-7 text-2xl'>Something went wrong!</p>
      )}
      {listing && !loading && !error && (
        <div className='max-w-6xl mx-auto px-3 sm:px-4 my-4'>
          {/* Slick Hero Swiper */}
          <div className='rounded-3xl overflow-hidden shadow-md border border-slate-200/80 relative'>
            <Swiper navigation className='rounded-3xl'>
              {listing.imageUrls.map((url) => (
                <SwiperSlide key={url}>
                  <div
                    className='h-[420px] sm:h-[520px] w-full'
                    style={{
                      background: `url(${url}) center no-repeat`,
                      backgroundSize: 'cover',
                    }}
                  ></div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Slick Share Floating Button */}
          <button
            type='button'
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 2000);
            }}
            title='Share link'
            className='fixed top-24 right-6 z-30 rounded-full w-11 h-11 flex justify-center items-center bg-white/90 backdrop-blur-md shadow-md border border-slate-200/80 hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer'
          >
            <FaShare className='text-slate-700 text-sm' />
          </button>

          {copied && (
            <div className='fixed top-36 right-6 z-30 rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2 shadow-lg animate-slideDown flex items-center gap-1.5'>
              <span className='w-1.5 h-1.5 rounded-full bg-emerald-400'></span>
              <span>{t('detail.linkCopied')}</span>
            </div>
          )}

          <div className='max-w-4xl mx-auto my-7'>
            <div className='bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col gap-5'>
              <div className='flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-100 pb-4'>
                <h1 className='text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight'>
                  {listing.title || listing.name}
                </h1>
                <p className='text-xl sm:text-2xl font-black text-slate-900 shrink-0'>
                  ${(listing.offer ? listing.discountPrice : listing.regularPrice).toLocaleString('en-US')}
                  <span className='text-xs sm:text-sm font-normal text-slate-500 ml-1'>
                    {listing.type === 'rent' ? t('listing.perNight') : t('listing.perDayDriver')}
                  </span>
                </p>
              </div>

              <p className='flex items-center gap-2 text-slate-500 text-xs sm:text-sm font-medium'>
                <FaMapMarkerAlt className='text-emerald-600 text-base shrink-0' />
                <span>{listing.location || listing.address}</span>
              </p>

              <div className='flex items-center gap-2.5 flex-wrap'>
                <span className='bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full'>
                  {listing.type === 'rent' ? t('detail.guestHouseRental') : t('detail.carWithDriver')}
                </span>
                {listing.offer && (
                  <span className='bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full'>
                    ${+listing.regularPrice - +listing.discountPrice} {t('detail.off')}
                  </span>
                )}
              </div>

              <div className='py-1'>
                <h2 className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5'>
                  {t('detail.description')}
                </h2>
                <p className='text-slate-700 leading-relaxed text-sm sm:text-base'>
                  {listing.description}
                </p>
              </div>

              <div className='pt-2 border-t border-slate-100'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-3'>
                  Amenities & Details
                </h3>
                <ul className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-slate-700 text-xs sm:text-sm font-medium'>
                  {listing.type === 'rent' ? (
                    <>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaBed className='text-slate-600 text-base shrink-0' />
                        <span>
                          {listing.bedrooms > 1
                            ? `${listing.bedrooms} ${t('listing.beds')}`
                            : `${listing.bedrooms} ${t('listing.bed')}`}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaBath className='text-slate-600 text-base shrink-0' />
                        <span>
                          {listing.bathrooms > 1
                            ? `${listing.bathrooms} ${t('listing.baths')}`
                            : `${listing.bathrooms} ${t('listing.bath')}`}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaParking className='text-slate-600 text-base shrink-0' />
                        <span>{listing.parking ? t('detail.privateParking') : t('detail.noParking')}</span>
                      </li>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaWifi className='text-slate-600 text-base shrink-0' />
                        <span>{listing.furnished ? t('detail.furnishedWifi') : t('detail.standardAmenities')}</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaCar className='text-slate-600 text-base shrink-0' />
                        <span>
                          {listing.bedrooms > 1
                            ? `${listing.bedrooms} ${t('listing.seats')}`
                            : `${listing.bedrooms} ${t('listing.seat')}`}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaDoorOpen className='text-slate-600 text-base shrink-0' />
                        <span>
                          {listing.bathrooms > 1
                            ? `${listing.bathrooms} ${t('listing.luggage')}`
                            : `${listing.bathrooms} ${t('listing.luggage')}`}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaUserTie className='text-slate-600 text-base shrink-0' />
                        <span>{listing.parking ? t('detail.chauffeurIncluded') : t('detail.onDemandDriver')}</span>
                      </li>
                      <li className='flex items-center gap-2 bg-slate-50 border border-slate-200/70 p-2.5 rounded-xl'>
                        <FaShieldAlt className='text-slate-600 text-base shrink-0' />
                        <span>{listing.furnished ? t('detail.fuelInsurance') : t('detail.standardCoverage')}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

            {/* Primary Enquire Action Section */}
            <div className='bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xs my-3'>
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                <div>
                  <h3 className='text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap'>
                    <span>{listing.type === 'rent' ? t('enquire.button') : t('enquire.buttonCar')}</span>
                    <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200'>
                      {t('enquire.responseBadge')}
                    </span>
                  </h3>
                  <p className='text-xs sm:text-sm text-slate-500 mt-0.5'>
                    {t('enquire.subtitle')}
                  </p>
                </div>

                <div className='flex items-center gap-1.5 flex-wrap shrink-0'>
                  <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200'>
                    <FaWhatsapp /> WhatsApp
                  </span>
                  <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200'>
                    <FaEnvelope /> Email
                  </span>
                  <span className='inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300'>
                    <FaPhoneAlt /> Call
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className='flex flex-col sm:flex-row items-stretch gap-2.5 pt-1'>
                <button
                  id='open-enquiry-modal-btn'
                  type='button'
                  onClick={() => setEnquireModalOpen(true)}
                  className='flex-1 flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-sm transition hover:shadow-md text-sm sm:text-base cursor-pointer'
                >
                  <FaCommentDots className='text-amber-400 text-lg shrink-0' />
                  <span>{listing.type === 'rent' ? t('enquire.button') : t('enquire.buttonCar')}</span>
                </button>

                <button
                  id='direct-whatsapp-btn'
                  type='button'
                  onClick={() => setEnquireModalOpen(true)}
                  className='flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition text-xs sm:text-sm cursor-pointer'
                  title='Enquire via WhatsApp'
                >
                  <FaWhatsapp className='text-base shrink-0' />
                  <span>WhatsApp</span>
                </button>

                <button
                  id='direct-email-btn'
                  type='button'
                  onClick={() => setEnquireModalOpen(true)}
                  className='flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition text-xs sm:text-sm cursor-pointer'
                  title='Enquire via Email'
                >
                  <FaEnvelope className='text-sm shrink-0' />
                  <span>Email</span>
                </button>
              </div>
            </div>

            {/* Quick Inline Contact Toggle */}
            {currentUser && listing.userRef !== currentUser._id && !contact && (
              <button
                onClick={() => setContact(true)}
                className='text-xs text-slate-500 hover:text-slate-800 underline self-start py-1'
              >
                {t('contact.placeholder')} (Inline form)
              </button>
            )}
            {contact && <Contact listing={listing} />}

            {/* Enquire Modal with Email, WhatsApp, and Phone channels */}
            <EnquireModal
              listing={listing}
              isOpen={enquireModalOpen}
              onClose={() => setEnquireModalOpen(false)}
            />
          </div>
        </div>

          {/* Mobile floating enquire bar */}
          <div className='sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3'>
            <div>
              <p className='text-[11px] text-slate-500 font-medium'>
                {listing.type === 'rent' ? t('listing.perNight') : t('listing.perDayDriver')}
              </p>
              <p className='text-base font-bold text-slate-900 leading-tight'>
                ${(listing.offer ? listing.discountPrice : listing.regularPrice).toLocaleString('en-US')}
              </p>
            </div>
            <button
              id='floating-enquire-btn'
              type='button'
              onClick={() => setEnquireModalOpen(true)}
              className='flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md active:scale-95 transition'
            >
              <FaCommentDots className='text-amber-400' />
              <span>{t('enquire.button')}</span>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
