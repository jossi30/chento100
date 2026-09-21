import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminDashboard() {
  const { currentUser } = useSelector((state) => state.user);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [notification, setNotification] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'guesthouse', 'car_service'
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingListing, setEditingListing] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Delete Confirmation Modal State
  const [deletingListing, setDeletingListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(currentUser?.token ? { Authorization: `Bearer ${currentUser.token}` } : {}),
    ...(currentUser?._id ? { 'x-user-id': currentUser._id } : {}),
    ...(currentUser?.email ? { 'x-user-email': currentUser.email } : {}),
    'x-user-role': 'admin',
    'x-admin-auth': 'true',
  });

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all listings from admin endpoint so admin has access to every current & future listing
      let res = await fetch('/api/admin/listings', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      // Resilient fallback: if admin endpoint fails for any reason, fetch from public listings endpoint
      if (!res.ok) {
        console.warn(`Admin listings returned ${res.status}, falling back to /api/listing/get`);
        res = await fetch('/api/listing/get?limit=100', {
          credentials: 'include',
        });
      }

      if (!res.ok) {
        throw new Error(`Failed to load listings (${res.status})`);
      }
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Action: Approve Listing
  const handleApprove = async (id, title) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'approving' }));
      const res = await fetch(`/api/admin/approve/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to approve listing');
      }

      setListings((prevListings) =>
        prevListings.map((item) =>
          item._id === id
            ? { ...item, isApproved: true, status: 'approved' }
            : item
        )
      );

      showNotification(
        `Listing "${title || 'Item'}" has been approved successfully!`,
        'success'
      );
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 2. Action: Toggle Live/Offline
  const handleToggleStatus = async (id, currentActive, title) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: 'toggling' }));
      const res = await fetch(`/api/admin/toggle-status/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to toggle listing status');
      }

      const newActive =
        data.isActive !== undefined
          ? data.isActive
          : data.active !== undefined
          ? data.active
          : !currentActive;

      setListings((prevListings) =>
        prevListings.map((item) =>
          item._id === id
            ? { ...item, isActive: newActive, active: newActive }
            : item
        )
      );

      showNotification(
        `Listing "${title || 'Item'}" status changed to ${
          newActive ? 'Live (Online)' : 'Offline'
        }.`,
        'info'
      );
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 3. Action: Open Edit Modal for any listing
  const handleOpenEdit = (listing) => {
    setEditingListing(listing);
    setEditError(null);
    setNewImageUrl('');
    const rawCategory = listing.category || (listing.type === 'sale' ? 'car_service' : 'guesthouse');
    const isAppr = Boolean(listing.isApproved || listing.status === 'approved');
    const isAct =
      listing.isActive !== undefined
        ? Boolean(listing.isActive)
        : listing.active !== undefined
        ? Boolean(listing.active)
        : true;

    setEditFormData({
      title: listing.title || listing.name || '',
      name: listing.name || listing.title || '',
      description: listing.description || '',
      category: rawCategory === 'car' ? 'car_service' : rawCategory,
      location: listing.location || listing.address || '',
      address: listing.address || listing.location || '',
      regularPrice: listing.regularPrice !== undefined ? listing.regularPrice : listing.price || 0,
      price: listing.price !== undefined ? listing.price : listing.regularPrice || 0,
      discountPrice: listing.discountPrice || 0,
      offer: Boolean(listing.offer),
      isApproved: isAppr,
      status: isAppr ? 'approved' : listing.status || 'pending',
      isActive: isAct,
      active: isAct,
      // Guesthouse
      bedrooms: listing.bedrooms !== undefined ? listing.bedrooms : 1,
      bathrooms: listing.bathrooms !== undefined ? listing.bathrooms : 1,
      maxGuests: listing.maxGuests || 2,
      furnished: Boolean(listing.furnished),
      parking: Boolean(listing.parking),
      amenities: Array.isArray(listing.amenities)
        ? listing.amenities
        : typeof listing.amenities === 'string' && listing.amenities
        ? listing.amenities.split(',').map((s) => s.trim())
        : ['WiFi', 'Kitchen', 'Air Conditioning'],
      // Car Service
      make: listing.make || '',
      model: listing.model || '',
      year: listing.year || 2023,
      seats: listing.seats || 4,
      transmission: listing.transmission || 'automatic',
      driverName: listing.driverName || '',
      driverContact: listing.driverContact || listing.driverPhone || '',
      driverIncluded: listing.driverIncluded !== undefined ? Boolean(listing.driverIncluded) : true,
      luggageCapacity: listing.luggageCapacity || 2,
      imageUrls: Array.isArray(listing.imageUrls)
        ? [...listing.imageUrls]
        : Array.isArray(listing.imageURLs)
        ? [...listing.imageURLs]
        : [],
    });
  };

  const handleCloseEdit = () => {
    setEditingListing(null);
    setEditError(null);
    setNewImageUrl('');
  };

  const handleEditFieldChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'title' ? { name: value } : {}),
      ...(field === 'location' ? { address: value } : {}),
      ...(field === 'regularPrice' ? { price: Number(value) } : {}),
    }));
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setEditFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImageUrl = (indexToRemove) => {
    setEditFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAddSamplePhotos = (type) => {
    if (type === 'guesthouse') {
      const apartmentPhotos = [
        '/images/airbnb_apartment_living.jpg',
        '/images/airbnb_apartment_bed.jpg',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      ];
      setEditFormData((prev) => ({
        ...prev,
        imageUrls: Array.from(new Set([...prev.imageUrls, ...apartmentPhotos])),
      }));
    } else {
      const carPhotos = [
        '/images/city_regular_sedan.jpg',
        '/images/city_driver_car.jpg',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
      ];
      setEditFormData((prev) => ({
        ...prev,
        imageUrls: Array.from(new Set([...prev.imageUrls, ...carPhotos])),
      }));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    if (!editFormData.title?.trim()) {
      setEditError('Listing title is required.');
      return;
    }
    if (!editFormData.location?.trim()) {
      setEditError('Location / Address is required.');
      return;
    }
    if (editFormData.imageUrls.length === 0) {
      setEditError('Listing must contain at least one photo.');
      return;
    }

    try {
      setIsSavingEdit(true);
      setEditError(null);

      const payload = {
        ...editingListing,
        ...editFormData,
        price: Number(editFormData.regularPrice || editFormData.price),
        regularPrice: Number(editFormData.regularPrice || editFormData.price),
        discountPrice: Number(editFormData.discountPrice || 0),
        status: editFormData.isApproved ? 'approved' : editFormData.status,
        active: Boolean(editFormData.isActive),
      };

      const res = await fetch(`/api/admin/listings/${editingListing._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update listing.');
      }

      setListings((prevListings) =>
        prevListings.map((item) =>
          item._id === editingListing._id ? { ...item, ...payload, ...data } : item
        )
      );

      showNotification(
        `Listing "${editFormData.title}" updated successfully!`,
        'success'
      );
      handleCloseEdit();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. Action: Prompt & Confirm Delete
  const handlePromptDelete = (listing) => {
    setDeletingListing(listing);
  };

  const handleCancelDelete = () => {
    setDeletingListing(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingListing) return;
    const id = deletingListing._id;
    const title = deletingListing.title || deletingListing.name || 'Listing';

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to delete listing.');
      }

      setListings((prevListings) =>
        prevListings.filter((item) => item._id !== id)
      );

      showNotification(`Listing "${title}" has been permanently deleted.`, 'info');
      setDeletingListing(null);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter listings based on category, search, and active tab
  const filteredListings = listings.filter((item) => {
    if (activeTab === 'pending') {
      const isApproved = Boolean(item.isApproved || item.status === 'approved');
      if (isApproved) return false;
    }

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'guesthouse' && item.category !== 'guesthouse') {
        return false;
      }
      if (
        categoryFilter === 'car_service' &&
        item.category !== 'car_service' &&
        item.category !== 'car'
      ) {
        return false;
      }
    }

    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const title = String(item?.title || item?.name || '').toLowerCase();
      const location = String(item?.location || item?.address || '').toLowerCase();
      const id = String(item?._id || '').toLowerCase();
      return title.includes(term) || location.includes(term) || id.includes(term);
    }

    return true;
  });

  const pendingCount = listings.filter(
    (item) => !item.isApproved && item.status !== 'approved'
  ).length;

  const totalCount = listings.length;
  const liveCount = listings.filter(
    (item) =>
      (item.isActive !== undefined ? item.isActive : item.active !== undefined ? item.active : true) &&
      (item.isApproved || item.status === 'approved')
  ).length;

  return (
    <div className='min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <span className='px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-slate-800 text-amber-400 rounded'>
                Admin Console
              </span>
              <span className='text-xs text-slate-500'>
                Logged in as: {currentUser?.username || currentUser?.email}
              </span>
            </div>
            <h1 className='text-2xl sm:text-3xl font-bold text-slate-900'>
              Admin Moderation &amp; Listing Management
            </h1>
            <p className='text-sm text-slate-600 mt-1'>
              Full administrative access to edit, moderate, and delete all current and future guest houses and city cars with driver.
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={fetchListings}
              disabled={loading}
              className='flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer'
              title='Reload current and newly created listings'
            >
              <svg
                className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              Refresh
            </button>
            <Link
              to='/create-listing'
              className='flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition'
            >
              + Create Listing
            </Link>
          </div>
        </div>

        {/* Dynamic Notification Toast Banner */}
        {notification && (
          <div
            className={`my-4 p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-xs transition-all duration-300 ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : notification.type === 'info'
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className='flex items-center gap-2'>
              {notification.type === 'error' ? (
                <svg className='w-5 h-5 text-red-600 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              ) : (
                <svg className='w-5 h-5 text-emerald-600 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 01-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className='text-slate-400 hover:text-slate-600 font-bold px-1 cursor-pointer'
            >
              &times;
            </button>
          </div>
        )}

        {/* Quick KPI Metric Highlights */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 my-6'>
          <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Total Listings
            </div>
            <div className='text-2xl font-bold text-slate-900 mt-1'>{totalCount}</div>
            <div className='text-[11px] text-slate-400 mt-0.5'>All platform inventory</div>
          </div>

          <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
            <div className='text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center justify-between'>
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className='w-2 h-2 rounded-full bg-amber-500 animate-ping' />
              )}
            </div>
            <div className='text-2xl font-bold text-amber-600 mt-1'>{pendingCount}</div>
            <div className='text-[11px] text-slate-400 mt-0.5'>Awaiting admin approval</div>
          </div>

          <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
            <div className='text-xs font-semibold text-emerald-600 uppercase tracking-wider'>
              Live Online
            </div>
            <div className='text-2xl font-bold text-emerald-600 mt-1'>{liveCount}</div>
            <div className='text-[11px] text-slate-400 mt-0.5'>Visible to public guests</div>
          </div>

          <div className='bg-white p-4 rounded-xl border border-slate-200 shadow-xs'>
            <div className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>
              Offline / Paused
            </div>
            <div className='text-2xl font-bold text-slate-700 mt-1'>{totalCount - liveCount}</div>
            <div className='text-[11px] text-slate-400 mt-0.5'>Hidden from public search</div>
          </div>
        </div>

        {/* Filter and Tab Navigation Bar */}
        <div className='my-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4'>
          {/* Main Tabs: Pending Approvals vs All Listings */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              id='tab-pending-listings'
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'pending'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type='button'
              id='tab-all-listings'
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Listings ({listings.length})
            </button>
          </div>

          {/* Search and Category Filters */}
          <div className='flex flex-wrap items-center gap-3'>
            {/* Category Filter Pills */}
            <div className='flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200'>
              <button
                type='button'
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type='button'
                onClick={() => setCategoryFilter('guesthouse')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  categoryFilter === 'guesthouse'
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Guest Houses
              </button>
              <button
                type='button'
                onClick={() => setCategoryFilter('car_service')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                  categoryFilter === 'car_service'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cars &amp; Drivers
              </button>
            </div>

            {/* Search Input */}
            <div className='relative'>
              <input
                type='text'
                placeholder='Search title, address, or ID...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-800 w-48 sm:w-64'
              />
              <svg
                className='w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              {searchTerm && (
                <button
                  type='button'
                  onClick={() => setSearchTerm('')}
                  className='absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs'
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section: Table / States */}
        {loading ? (
          <div className='p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs'>
            <div className='inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-3' />
            <p className='text-sm text-slate-500'>Loading listings from database...</p>
          </div>
        ) : error ? (
          <div className='p-8 text-center bg-white rounded-xl border border-red-200 shadow-xs'>
            <div className='text-red-600 font-semibold mb-2'>Failed to load listings</div>
            <p className='text-xs text-slate-500 mb-4'>{error}</p>
            <button
              onClick={fetchListings}
              className='px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 transition cursor-pointer'
            >
              Try Again
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className='p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600'>
              <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <h2 className='text-lg font-bold text-slate-800 mb-1'>
              {activeTab === 'pending'
                ? 'All Caught Up! No Pending Listings'
                : 'No Listings Found'}
            </h2>
            <p className='text-sm text-slate-500 max-w-md mx-auto mb-6'>
              {activeTab === 'pending'
                ? 'There are currently no unapproved listings waiting for administrator moderation. All submissions are up to date.'
                : 'No listings match your search criteria. Try changing your filters or add a new listing.'}
            </p>
            {activeTab === 'pending' ? (
              <button
                type='button'
                onClick={() => setActiveTab('all')}
                className='px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer'
              >
                View All Listings
              </button>
            ) : (
              <button
                type='button'
                onClick={() => {
                  setCategoryFilter('all');
                  setSearchTerm('');
                }}
                className='px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition cursor-pointer'
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Listings Table with Full Edit & Delete Controls */
          <div className='bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-slate-100/75 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider'>
                    <th className='py-3.5 px-4'>Listing Info</th>
                    <th className='py-3.5 px-4'>Category</th>
                    <th className='py-3.5 px-4'>Rate / Specs</th>
                    <th className='py-3.5 px-4'>Status</th>
                    <th className='py-3.5 px-4 text-right'>Admin Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200 text-sm'>
                  {filteredListings.map((listing) => {
                    const isGuesthouse = listing.category === 'guesthouse';
                    const isCarService =
                      listing.category === 'car_service' || listing.category === 'car';

                    const isApproved = Boolean(
                      listing.isApproved || listing.status === 'approved'
                    );

                    const isActive =
                      listing.isActive !== undefined
                        ? listing.isActive
                        : listing.active !== undefined
                        ? listing.active
                        : true;

                    const title = listing.title || listing.name || 'Untitled Listing';
                    const location =
                      listing.location || listing.address || 'Location unavailable';

                    const imageUrl =
                      (listing.imageUrls && listing.imageUrls[0]) ||
                      (listing.imageURLs && listing.imageURLs[0]) ||
                      (isGuesthouse
                        ? '/images/airbnb_apartment_living.jpg'
                        : '/images/city_regular_sedan.jpg');

                    const price =
                      listing.price !== undefined
                        ? listing.price
                        : listing.regularPrice || 0;

                    return (
                      <tr
                        key={listing._id}
                        className='hover:bg-slate-50/80 transition-colors duration-150'
                      >
                        {/* Listing Info */}
                        <td className='py-4 px-4'>
                          <div className='flex items-center gap-3.5'>
                            <div className='w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200'>
                              <img
                                src={imageUrl}
                                alt={title}
                                className='w-full h-full object-cover'
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = isGuesthouse
                                    ? '/images/airbnb_apartment_living.jpg'
                                    : '/images/city_regular_sedan.jpg';
                                }}
                              />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <Link
                                to={`/listing/${listing._id}`}
                                className='font-semibold text-slate-900 hover:text-blue-600 line-clamp-1'
                              >
                                {title}
                              </Link>
                              <p className='text-xs text-slate-500 line-clamp-1 mt-0.5'>
                                {location}
                              </p>
                              <div className='flex items-center gap-2 mt-1'>
                                <span className='text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded'>
                                  ID: {listing._id}
                                </span>
                                {listing.userRef && (
                                  <span className='text-[11px] text-slate-400'>
                                    Owner: {listing.userRef.substring(0, 10)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className='py-4 px-4 whitespace-nowrap'>
                          {isGuesthouse ? (
                            <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200'>
                              <svg
                                className='w-3.5 h-3.5 text-indigo-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                                />
                              </svg>
                              Guest House
                            </span>
                          ) : isCarService ? (
                            <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                              <svg
                                className='w-3.5 h-3.5 text-emerald-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                                />
                              </svg>
                              Car &amp; Driver
                            </span>
                          ) : (
                            <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700'>
                              {listing.category || 'General'}
                            </span>
                          )}
                        </td>

                        {/* Rate & Specs */}
                        <td className='py-4 px-4'>
                          <div className='font-semibold text-slate-900'>
                            ${price.toLocaleString()}
                            <span className='text-xs font-normal text-slate-500'>
                              {isGuesthouse ? ' / night' : ' / day'}
                            </span>
                          </div>
                          <div className='text-xs text-slate-500 mt-0.5'>
                            {isGuesthouse ? (
                              <span>
                                {listing.bedrooms || 1} Bed • {listing.bathrooms || 1} Bath
                                {listing.furnished ? ' • Furnished' : ''}
                              </span>
                            ) : (
                              <span>
                                {listing.make || ''} {listing.model || ''}
                                {listing.seats ? ` • ${listing.seats} Seats` : ''}
                                {listing.driverName ? ` • Driver: ${listing.driverName}` : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Badges */}
                        <td className='py-4 px-4 whitespace-nowrap'>
                          <div className='flex flex-col gap-1.5'>
                            {isApproved ? (
                              <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200'>
                                <svg
                                  className='w-3 h-3 text-emerald-700'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                                Approved
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'>
                                <svg
                                  className='w-3 h-3 text-amber-700'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                                Pending Review
                              </span>
                            )}

                            {isActive ? (
                              <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200'>
                                <span className='w-1.5 h-1.5 rounded-full bg-blue-600' />
                                Live
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200'>
                                <span className='w-1.5 h-1.5 rounded-full bg-slate-400' />
                                Offline
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Admin Actions: Approve, Live/Offline, Edit, Delete, Preview */}
                        <td className='py-4 px-4 text-right whitespace-nowrap'>
                          <div className='flex items-center justify-end gap-1.5'>
                            {/* Approve Button (if pending) */}
                            {!isApproved && (
                              <button
                                type='button'
                                onClick={() => handleApprove(listing._id, title)}
                                disabled={actionLoading[listing._id] === 'approving'}
                                className='px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-75 transition cursor-pointer flex items-center gap-1'
                                title='Approve listing'
                              >
                                {actionLoading[listing._id] === 'approving' ? (
                                  <span className='inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                ) : (
                                  <svg
                                    className='w-3.5 h-3.5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth='2'
                                      d='M5 13l4 4L19 7'
                                    />
                                  </svg>
                                )}
                                <span>Approve</span>
                              </button>
                            )}

                            {/* Toggle Live/Offline Button */}
                            <button
                              type='button'
                              onClick={() =>
                                handleToggleStatus(listing._id, isActive, title)
                              }
                              disabled={actionLoading[listing._id] === 'toggling'}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border shadow-xs disabled:opacity-75 transition cursor-pointer flex items-center gap-1 ${
                                isActive
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                              }`}
                              title={isActive ? 'Take offline' : 'Make live'}
                            >
                              {actionLoading[listing._id] === 'toggling' ? (
                                <span className='inline-block w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin' />
                              ) : isActive ? (
                                <svg
                                  className='w-3.5 h-3.5 text-slate-600'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className='w-3.5 h-3.5 text-indigo-600'
                                  fill='none'
                                  stroke='currentColor'
                                  viewBox='0 0 24 24'
                                >
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                  />
                                  <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                  />
                                </svg>
                              )}
                              <span>{isActive ? 'Offline' : 'Live'}</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type='button'
                              onClick={() => handleOpenEdit(listing)}
                              className='px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1'
                              title='Edit listing details'
                            >
                              <svg
                                className='w-3.5 h-3.5 text-blue-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                />
                              </svg>
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type='button'
                              onClick={() => handlePromptDelete(listing)}
                              className='px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1'
                              title='Permanently delete listing'
                            >
                              <svg
                                className='w-3.5 h-3.5 text-rose-600'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                />
                              </svg>
                              <span>Delete</span>
                            </button>

                            {/* Preview Button */}
                            <Link
                              to={`/listing/${listing._id}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition'
                              title='Preview public view'
                            >
                              <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN EDIT LISTING MODAL */}
        {/* ========================================================================= */}
        {editingListing && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn'>
            <div className='bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto'>
              {/* Modal Header */}
              <div className='flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded'>
                      Admin Editor
                    </span>
                    <span className='text-xs font-mono text-slate-500'>
                      ID: {editingListing._id}
                    </span>
                  </div>
                  <h2 className='text-lg font-bold text-slate-900 mt-1'>
                    Edit Listing: {editingListing.title || editingListing.name}
                  </h2>
                </div>
                <button
                  type='button'
                  onClick={handleCloseEdit}
                  className='p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                  </svg>
                </button>
              </div>

              {/* Modal Scrollable Form */}
              <form onSubmit={handleSaveEdit} className='flex-1 overflow-y-auto p-6 space-y-6'>
                {editError && (
                  <div className='p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2'>
                    <svg className='w-4 h-4 text-red-500 shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                    </svg>
                    <span>{editError}</span>
                  </div>
                )}

                {/* 1. Category Switcher */}
                <div>
                  <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2'>
                    Listing Category
                  </label>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type='button'
                      onClick={() => handleEditFieldChange('category', 'guesthouse')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        editFormData.category === 'guesthouse'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className='p-2 bg-indigo-100 text-indigo-700 rounded-lg'>
                        🏠
                      </span>
                      <div>
                        <div className='text-xs font-bold'>Guest House Airbnb</div>
                        <div className='text-[11px] text-slate-500'>Apartments, lofts, suites</div>
                      </div>
                    </button>

                    <button
                      type='button'
                      onClick={() => handleEditFieldChange('category', 'car_service')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        editFormData.category === 'car_service' || editFormData.category === 'car'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className='p-2 bg-emerald-100 text-emerald-700 rounded-lg'>
                        🚗
                      </span>
                      <div>
                        <div className='text-xs font-bold'>City Car with Driver</div>
                        <div className='text-[11px] text-slate-500'>Sedans, city chauffeurs</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Basic Info: Title, Location, Description */}
                <div className='space-y-4'>
                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Listing Title <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={editFormData.title || ''}
                      onChange={(e) => handleEditFieldChange('title', e.target.value)}
                      placeholder='e.g. Modern Downtown Studio Apartment Airbnb'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Location / Address <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={editFormData.location || ''}
                      onChange={(e) => handleEditFieldChange('location', e.target.value)}
                      placeholder='e.g. 450 Pine St, Downtown City Center'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-bold text-slate-700 mb-1'>
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editFormData.description || ''}
                      onChange={(e) => handleEditFieldChange('description', e.target.value)}
                      placeholder='Describe space, amenities, or vehicle details...'
                      className='w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                {/* 3. Pricing and Special Offer */}
                <div className='bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3'>
                  <div className='text-xs font-bold text-slate-800 uppercase tracking-wider'>
                    Pricing &amp; Rates
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-center'>
                    <div>
                      <label className='block text-xs text-slate-600 font-semibold mb-1'>
                        Regular Rate ($ / {editFormData.category === 'guesthouse' ? 'night' : 'day'})
                      </label>
                      <input
                        type='number'
                        min='1'
                        value={editFormData.regularPrice || ''}
                        onChange={(e) => handleEditFieldChange('regularPrice', e.target.value)}
                        className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        required
                      />
                    </div>

                    <div className='flex items-center gap-2 pt-4'>
                      <input
                        type='checkbox'
                        id='edit-offer'
                        checked={Boolean(editFormData.offer)}
                        onChange={(e) => handleEditFieldChange('offer', e.target.checked)}
                        className='w-4 h-4 text-blue-600 rounded cursor-pointer'
                      />
                      <label htmlFor='edit-offer' className='text-xs font-semibold text-slate-700 cursor-pointer'>
                        Special Offer / Discount
                      </label>
                    </div>

                    {editFormData.offer && (
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>
                          Discounted Rate ($)
                        </label>
                        <input
                          type='number'
                          min='0'
                          value={editFormData.discountPrice || ''}
                          onChange={(e) => handleEditFieldChange('discountPrice', e.target.value)}
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Moderation & Platform Status */}
                <div className='bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3'>
                  <div className='text-xs font-bold text-amber-900 uppercase tracking-wider'>
                    Admin Moderation &amp; Visibility Controls
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs font-semibold text-slate-700 mb-1'>
                        Approval Moderation Status
                      </label>
                      <select
                        value={editFormData.isApproved ? 'approved' : editFormData.status || 'pending'}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleEditFieldChange('status', val);
                          handleEditFieldChange('isApproved', val === 'approved');
                        }}
                        className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                      >
                        <option value='approved'>✓ Approved (Authorized to publish)</option>
                        <option value='pending'>⏳ Pending Review (Requires admin check)</option>
                        <option value='rejected'>✕ Rejected / Blocked</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-xs font-semibold text-slate-700 mb-1'>
                        Public Visibility
                      </label>
                      <select
                        value={editFormData.isActive ? 'live' : 'offline'}
                        onChange={(e) => {
                          const isLive = e.target.value === 'live';
                          handleEditFieldChange('isActive', isLive);
                          handleEditFieldChange('active', isLive);
                        }}
                        className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                      >
                        <option value='live'>🟢 Live (Searchable &amp; public)</option>
                        <option value='offline'>⚪ Offline (Hidden from search)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 5. Category-Specific Fields */}
                {editFormData.category === 'guesthouse' ? (
                  <div className='bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4'>
                    <div className='text-xs font-bold text-indigo-900 uppercase tracking-wider'>
                      Guest House Specifications
                    </div>
                    <div className='grid grid-cols-3 gap-3'>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Bedrooms</label>
                        <input
                          type='number'
                          min='1'
                          value={editFormData.bedrooms || 1}
                          onChange={(e) => handleEditFieldChange('bedrooms', Number(e.target.value))}
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Bathrooms</label>
                        <input
                          type='number'
                          min='1'
                          value={editFormData.bathrooms || 1}
                          onChange={(e) => handleEditFieldChange('bathrooms', Number(e.target.value))}
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Max Guests</label>
                        <input
                          type='number'
                          min='1'
                          value={editFormData.maxGuests || 2}
                          onChange={(e) => handleEditFieldChange('maxGuests', Number(e.target.value))}
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                    </div>

                    <div className='flex items-center gap-6 pt-1'>
                      <label className='flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={Boolean(editFormData.furnished)}
                          onChange={(e) => handleEditFieldChange('furnished', e.target.checked)}
                          className='w-4 h-4 text-indigo-600 rounded'
                        />
                        <span>Fully Furnished</span>
                      </label>

                      <label className='flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={Boolean(editFormData.parking)}
                          onChange={(e) => handleEditFieldChange('parking', e.target.checked)}
                          className='w-4 h-4 text-indigo-600 rounded'
                        />
                        <span>Free Resident Parking</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className='bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4'>
                    <div className='text-xs font-bold text-emerald-900 uppercase tracking-wider'>
                      City Car &amp; Driver Specifications
                    </div>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Make</label>
                        <input
                          type='text'
                          value={editFormData.make || ''}
                          onChange={(e) => handleEditFieldChange('make', e.target.value)}
                          placeholder='e.g. Toyota'
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Model</label>
                        <input
                          type='text'
                          value={editFormData.model || ''}
                          onChange={(e) => handleEditFieldChange('model', e.target.value)}
                          placeholder='e.g. Corolla Sedan'
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Year</label>
                        <input
                          type='number'
                          value={editFormData.year || 2023}
                          onChange={(e) => handleEditFieldChange('year', Number(e.target.value))}
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Passenger Seats</label>
                        <input
                          type='number'
                          min='1'
                          value={editFormData.seats || 4}
                          onChange={(e) => handleEditFieldChange('seats', Number(e.target.value))}
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Driver / Chauffeur Name</label>
                        <input
                          type='text'
                          value={editFormData.driverName || ''}
                          onChange={(e) => handleEditFieldChange('driverName', e.target.value)}
                          placeholder='e.g. Marcus Vance'
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-slate-600 font-semibold mb-1'>Driver Contact / Phone</label>
                        <input
                          type='text'
                          value={editFormData.driverContact || ''}
                          onChange={(e) => handleEditFieldChange('driverContact', e.target.value)}
                          placeholder='e.g. +1 305-555-0199'
                          className='w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm'
                        />
                      </div>
                    </div>

                    <div className='flex items-center gap-6 pt-1'>
                      <label className='flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={Boolean(editFormData.driverIncluded)}
                          onChange={(e) => handleEditFieldChange('driverIncluded', e.target.checked)}
                          className='w-4 h-4 text-emerald-600 rounded'
                        />
                        <span>Private Driver Included in Rate</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 6. Listing Photos Manager */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      Photos ({editFormData.imageUrls?.length || 0})
                    </label>
                    <div className='flex gap-2'>
                      <button
                        type='button'
                        onClick={() => handleAddSamplePhotos('guesthouse')}
                        className='px-2.5 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-medium cursor-pointer'
                      >
                        + Airbnb Photos
                      </button>
                      <button
                        type='button'
                        onClick={() => handleAddSamplePhotos('car_service')}
                        className='px-2.5 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-medium cursor-pointer'
                      >
                        + City Sedan Photos
                      </button>
                    </div>
                  </div>

                  {/* Image previews grid */}
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                    {editFormData.imageUrls?.map((url, idx) => (
                      <div
                        key={idx}
                        className='relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video'
                      >
                        <img
                          src={url}
                          alt={`Listing photo ${idx + 1}`}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/airbnb_apartment_living.jpg';
                          }}
                        />
                        <button
                          type='button'
                          onClick={() => handleRemoveImageUrl(idx)}
                          className='absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full shadow-md opacity-90 group-hover:opacity-100 hover:bg-red-700 transition cursor-pointer'
                          title='Remove photo'
                        >
                          <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                        {idx === 0 && (
                          <span className='absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-bold rounded'>
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Image URL Row */}
                  <div className='flex gap-2 pt-2'>
                    <input
                      type='text'
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder='Paste image URL here (e.g. /images/airbnb_apartment_bed.jpg or https://...)'
                      className='flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs'
                    />
                    <button
                      type='button'
                      onClick={handleAddImageUrl}
                      className='px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0'
                    >
                      Add Photo
                    </button>
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className='flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80'>
                <Link
                  to={`/update-listing/${editingListing._id}?from=admin`}
                  className='text-xs font-semibold text-slate-600 hover:text-blue-600 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Open in Full-Page Form ↗
                </Link>

                <div className='flex items-center gap-3'>
                  <button
                    type='button'
                    onClick={handleCloseEdit}
                    className='px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition cursor-pointer'
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className='px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-75 transition cursor-pointer flex items-center gap-1.5'
                  >
                    {isSavingEdit ? (
                      <>
                        <span className='inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                        </svg>
                        <span>Save Listing Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN DELETE CONFIRMATION MODAL */}
        {/* ========================================================================= */}
        {deletingListing && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn'>
            <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100'>
              <div className='w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </div>

              <h3 className='text-lg font-bold text-slate-900 mb-1'>
                Permanently Delete Listing?
              </h3>
              <p className='text-sm text-slate-600 mb-4'>
                You are about to delete <span className='font-bold text-slate-900'>&ldquo;{deletingListing.title || deletingListing.name}&rdquo;</span> (ID: <span className='font-mono text-xs text-slate-500'>{deletingListing._id}</span>).
              </p>
              <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 mb-6'>
                ⚠️ This action cannot be undone. This listing will be immediately and permanently removed from search results, user bookmarks, and all future guest catalogs.
              </div>

              <div className='flex items-center justify-end gap-3'>
                <button
                  type='button'
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className='px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition cursor-pointer'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className='px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs disabled:opacity-75 transition cursor-pointer flex items-center gap-1.5'
                >
                  {isDeleting ? (
                    <>
                      <span className='inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                      <span>Yes, Delete Listing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
