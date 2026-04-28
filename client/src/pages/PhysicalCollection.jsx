import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCenter,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import {
    FaPlus, FaTimes, FaEdit, FaTrash, FaDownload,
    FaTable, FaBookOpen, FaLayerGroup, FaSearch
} from 'react-icons/fa';
import './PhysicalCollection.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const API = 'http://localhost:8080/api/media';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const POSTER_SMALL = 'https://image.tmdb.org/t/p/w92';

const FORMAT_OPTIONS = ['none', 'dvd', 'blu-ray', '4k', 'vhs', 'vinyl', 'cd', 'hardcover', 'paperback'];
const STATUS_OPTIONS = ['none', 'available', 'loaned', 'lost'];

const SPINE_COLOURS = [
    '#5b7fa6', '#7a6a9e', '#6a9e82', '#a67a5b', '#9e7a6a',
    '#5b8fa6', '#8f6ba0', '#6b9e6a', '#a68a5b', '#6a7ea6'
];

const spineColour = (id = '') => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    return SPINE_COLOURS[Math.abs(hash) % SPINE_COLOURS.length];
};

const formatBadgeClass = (format) => `badge-format-${format}`;
const statusBadgeClass = (status) => `badge-status-${status}`;

const EMPTY_FORM = {
    format: 'blu-ray', physicalStatus: 'available',
    price: '', purchaseDate: '', shelfNumber: 1,
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function SpineCard({ item, onNavigate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item._id,
        data: { item },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        // Eliminăm forțarea lui 1 pentru a permite CSS-ului să controleze hover-ul
        zIndex: isDragging ? 999 : undefined,
    };

    const title = item.mediaId?.title || 'Unknown';
    const poster = item.mediaId?.posterPath;
    const tmdbId = item.mediaId?.externalId;
    const colour = spineColour(item._id);

    const handleSpineClick = () => {
        if (isDragging) return;
        if (tmdbId) onNavigate(tmdbId);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`pc-spine-wrapper${isDragging ? ' pc-spine-wrapper--dragging' : ''}`}
            {...attributes}
            {...listeners}
            onClick={handleSpineClick}
        >
            <div className="pc-spine" style={{ background: colour }}>
                <span className="pc-spine-title">{title}</span>
            </div>

            <div className="pc-hover-card">
                <div className="pc-hover-card-poster">
                    {poster ? <img src={`${TMDB_IMG}${poster}`} alt={title} /> : <div style={{ width: '100%', height: '100%', background: '#06181d' }} />}
                </div>
                <div className="pc-hover-card-body">
                    <span className="pc-hover-card-title">{title}</span>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                        <span className={`badge ${formatBadgeClass(item.format)} text-white`} style={{ fontSize: '0.6rem' }}>
                            {item.format?.toUpperCase()}
                        </span>
                        <span className={`badge ${statusBadgeClass(item.physicalStatus)} text-white`} style={{ fontSize: '0.6rem' }}>
                            {item.physicalStatus}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShelfRow({ shelfNumber, items, onNavigate, onRemoveShelf }) {
    const { setNodeRef, isOver } = useDroppable({ id: `shelf-${shelfNumber}` });

    return (
        <div className="pc-shelf-row">
            <div className="pc-shelf-header">
                <div className="pc-shelf-label">Shelf {shelfNumber}</div>
                <button onClick={() => onRemoveShelf(shelfNumber)} className="btn btn-sm text-danger opacity-50 p-0" title="Delete Shelf" style={{ border: 'none', background: 'transparent' }}>
                    <FaTrash />
                </button>
            </div>

            <SortableContext items={items.map(i => i._id)} strategy={rectSortingStrategy}>
                <div ref={setNodeRef} className={`pc-shelf-surface${isOver ? ' pc-shelf-surface--over' : ''}`}>
                    {items.length === 0 && <div className="pc-shelf-empty">Empty shelf. Drag items here.</div>}
                    {items.map((item) => (
                        <SpineCard key={item._id} item={item} onNavigate={onNavigate} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

// ─── Modals ───────────────────────────────────────────────────────────────

function AddModal({ onClose, onAdd, user, shelves }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [isAdding, setIsAdding] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        if (searchQuery.length < 2) return;
        const t = setTimeout(async () => {
            try {
                const res = await axios.get(`${API}/movies/search/${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data.slice(0, 5));
            } catch (e) { console.error('Search error:', e); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const handleSave = async () => {
        if (!selectedMovie) return setMsg("Please select a movie first.");
        setIsAdding(true);
        setMsg('');
        try {
            const res = await axios.post(`${API}/user/${user.id}/physical/add`, {
                tmdbId: selectedMovie.id,
                title: selectedMovie.title,
                posterPath: selectedMovie.poster_path || '',
                releaseYear: selectedMovie.release_date?.split('-')[0] || '',
                description: selectedMovie.overview || '',
                creator: 'Unknown',
                format: addForm.format,
                physicalStatus: addForm.physicalStatus,
                price: addForm.price !== '' ? parseFloat(addForm.price) : null,
                purchaseDate: addForm.purchaseDate || null,
                shelfNumber: parseInt(addForm.shelfNumber) || 1,
            });
            onAdd(res.data.item);
        } catch (err) {
            setMsg('Could not add item.');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="pc-modal-overlay" onClick={onClose}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Add New Item</h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="pc-search-wrapper mb-3">
                    <label><FaSearch className="me-1" /> Search Movie</label>
                    <input type="text" placeholder="Type movie title..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedMovie(null); }} />
                    {searchResults.length > 0 && !selectedMovie && (
                        <div className="pc-search-dropdown">
                            {searchResults.map((m) => (
                                <div key={m.id} className="pc-search-result" onClick={() => {
                                    setSelectedMovie(m);
                                    setSearchQuery(m.title);
                                    setSearchResults([]);
                                }}>
                                    {m.poster_path ? <img src={`${POSTER_SMALL}${m.poster_path}`} alt="poster" /> : <div style={{ width: 36, height: 54, background: '#0a2d35' }} />}
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#e8e8f0' }}>{m.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#6c8b99' }}>{m.release_date?.split('-')[0]}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="row g-3">
                    <div className="col-6">
                        <label>Format</label>
                        <select value={addForm.format} onChange={(e) => setAddForm((f) => ({ ...f, format: e.target.value }))}>
                            {FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="col-6">
                        <label>Status</label>
                        <select value={addForm.physicalStatus} onChange={(e) => setAddForm((f) => ({ ...f, physicalStatus: e.target.value }))}>
                            {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="col-4">
                        <label>Price (lei)</label>
                        <input type="number" min="0" step="0.01" value={addForm.price} onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div className="col-5">
                        <label>Purchase Date</label>
                        <input type="date" value={addForm.purchaseDate} onChange={(e) => setAddForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                    </div>
                    <div className="col-3">
                        <label>Shelf #</label>
                        <select value={addForm.shelfNumber} onChange={(e) => setAddForm((f) => ({ ...f, shelfNumber: parseInt(e.target.value) }))}>
                            {shelves.map((s) => <option key={s} value={s}>Shelf {s}</option>)}
                        </select>
                    </div>
                </div>

                {msg && <div className="mt-2 text-danger" style={{ fontSize: '0.8rem' }}>{msg}</div>}

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-sm btn-info fw-bold" disabled={isAdding || !selectedMovie} onClick={handleSave}>
                        {isAdding ? <span className="spinner-border spinner-border-sm me-1" /> : null} Add to Library
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditModal({ item, onSave, onClose, userId }) {
    const [form, setForm] = useState({
        format: item.format || 'none',
        physicalStatus: item.physicalStatus || 'none',
        price: item.price != null ? String(item.price) : '',
        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
        shelfNumber: item.shelfNumber ?? 1,
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    const handleSave = async () => {
        setSaving(true);
        setMsg('');
        try {
            const res = await axios.post(`${API}/user/${userId}/physical/add`, {
                tmdbId: item.mediaId?.externalId,
                title: item.mediaId?.title,
                posterPath: item.mediaId?.posterPath,
                format: form.format,
                physicalStatus: form.physicalStatus,
                price: form.price !== '' ? parseFloat(form.price) : null,
                purchaseDate: form.purchaseDate || null,
                shelfNumber: parseInt(form.shelfNumber) || 1,
            });
            onSave(res.data.item);
        } catch (err) {
            setMsg('Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pc-modal-overlay" onClick={onClose}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Edit — {item.mediaId?.title || 'Item'}</h5>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="row g-3">
                    <div className="col-6">
                        <label>Format</label>
                        <select value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}>
                            {FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="col-6">
                        <label>Status</label>
                        <select value={form.physicalStatus} onChange={(e) => setForm((f) => ({ ...f, physicalStatus: e.target.value }))}>
                            {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div className="col-6">
                        <label>Price (lei)</label>
                        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div className="col-6">
                        <label>Shelf #</label>
                        <input type="number" min="1" value={form.shelfNumber} onChange={(e) => setForm((f) => ({ ...f, shelfNumber: parseInt(e.target.value) }))} />
                    </div>
                    <div className="col-12">
                        <label>Purchase Date</label>
                        <input type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                    </div>
                </div>

                {msg && <div className="mt-2 text-danger" style={{ fontSize: '0.8rem' }}>{msg}</div>}

                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-sm btn-info fw-bold" disabled={saving} onClick={handleSave}>
                        {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
function PhysicalCollection() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('shelf');
    const [extraShelves, setExtraShelves] = useState([]);

    const [filterFormat, setFilterFormat] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );
    const [activeDragItem, setActiveDragItem] = useState(null);

    useEffect(() => { if (!user) navigate('/login'); }, []);

    const fetchCollection = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`${API}/user/${user.id}/physical`);
            setItems(res.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchCollection(); }, [fetchCollection]);

    const filteredItems = items.filter((item) => {
        if (filterFormat !== 'all' && item.format !== filterFormat) return false;
        if (filterStatus !== 'all' && item.physicalStatus !== filterStatus) return false;
        return true;
    });

    const occupiedShelves = [...new Set(filteredItems.map((i) => i.shelfNumber ?? 1))].sort((a, b) => a - b);
    const allShelves = [...new Set([...occupiedShelves, ...extraShelves])].sort((a, b) => a - b);
    const shelves = allShelves.length > 0 ? allShelves : [1, 2, 3];

    const shelveMap = filteredItems.reduce((acc, item) => {
        const s = item.shelfNumber ?? 1;
        if (!acc[s]) acc[s] = [];
        acc[s].push(item);
        return acc;
    }, {});

    const totalShelves = new Set(items.map((i) => i.shelfNumber ?? 1)).size;
    const loanedCount = items.filter((i) => i.physicalStatus === 'loaned').length;
    const lostCount = items.filter((i) => i.physicalStatus === 'lost').length;
    const totalValue = items.reduce((s, i) => s + (i.price ?? 0), 0);

    const handleAddShelf = () => {
        const maxExisting = Math.max(...shelves, 0);
        setExtraShelves((prev) => [...prev, maxExisting + 1]);
    };

    const handleRemoveShelf = async (shelfId) => {
        if (!window.confirm(`Delete Shelf ${shelfId}? Any items on this shelf will be safely moved to Shelf 1.`)) return;

        const itemsToMove = items.filter(i => i.shelfNumber === shelfId);

        setItems(prev => prev.map(i => i.shelfNumber === shelfId ? { ...i, shelfNumber: 1 } : i));
        setExtraShelves(prev => prev.filter(s => s !== shelfId));

        for (const item of itemsToMove) {
            try {
                await axios.put(`${API}/user/${user.id}/physical/move`, {
                    recordId: item._id,
                    shelfNumber: 1
                });
            } catch (error) { console.error("Failed backend update"); }
        }
    };

    const handleDragStart = ({ active }) => {
        setActiveDragItem(items.find((i) => i._id === active.id) || null);
    };

    const handleDragEnd = async ({ active, over }) => {
        setActiveDragItem(null);
        if (!over) return;

        const activeItem = items.find((i) => i._id === active.id);
        const overItem = items.find((i) => i._id === over.id);

        const targetShelf = overItem ? overItem.shelfNumber : parseInt(over.id.replace('shelf-', ''));

        if (!activeItem || isNaN(targetShelf)) return;

        if (activeItem.shelfNumber === targetShelf && overItem && active.id !== over.id) {
            const oldIndex = items.findIndex(i => i._id === active.id);
            const newIndex = items.findIndex(i => i._id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));
            return;
        }

        if (activeItem.shelfNumber !== targetShelf) {
            setItems((prev) => prev.map((i) => i._id === active.id ? { ...i, shelfNumber: targetShelf } : i));
            try {
                await axios.put(`${API}/user/${user.id}/physical/move`, {
                    recordId: active.id,
                    shelfNumber: targetShelf,
                });
            } catch (err) {
                setItems((prev) => prev.map((i) => i._id === active.id ? { ...i, shelfNumber: activeItem.shelfNumber } : i));
            }
        }
    };

    const handleExportCSV = () => {
        const headers = ['Title', 'Format', 'Status', 'Shelf', 'Price (lei)', 'Purchase Date'];
        const rows = filteredItems.map((item) => [
            `"${(item.mediaId?.title || 'Unknown').replace(/"/g, '""')}"`,
            item.format, item.physicalStatus,
            item.shelfNumber ?? 1,
            item.price ?? '',
            item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : ''
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'physical_collection.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleRemove = async (recordId) => {
        if (!window.confirm('Remove this item from your physical collection?')) return;
        try {
            await axios.delete(`${API}/user-media/${recordId}`);
            setItems((prev) => prev.filter((i) => i._id !== recordId));
        } catch (err) { console.error('Remove error:', err); }
    };

    const handleAddSave = (newItem) => {
        setItems(prev => {
            const existing = prev.find(i => i._id === newItem._id);
            if (existing) return prev.map(i => i._id === newItem._id ? newItem : i);
            return [...prev, newItem];
        });
        setShowAddForm(false);
    };

    const handleEditSave = (updatedItem) => {
        setItems((prev) => prev.map((i) => i._id === updatedItem._id ? updatedItem : i));
        setEditingItem(null);
    };

    if (isLoading) {
        return (
            <div className="pc-page d-flex align-items-center justify-content-center">
                <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    return (
        <div className="pc-page">
            {showAddForm && <AddModal onClose={() => setShowAddForm(false)} onAdd={handleAddSave} user={user} shelves={shelves} />}
            {editingItem && <EditModal item={editingItem} userId={user.id} onSave={handleEditSave} onClose={() => setEditingItem(null)} />}

            <div className="container-lg py-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                    <div>
                        <h2 className="fw-bold mb-0" style={{ color: '#e8e8f0' }}>Physical Collection</h2>
                        <p className="text-secondary mb-0" style={{ fontSize: '0.875rem' }}>Your real-world library, digitised.</p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <button className="btn btn-sm fw-bold btn-info text-dark" onClick={() => setShowAddForm(true)}>
                            <FaPlus className="me-1" />Add Item
                        </button>
                        <button className="btn btn-sm fw-bold btn-outline-light" onClick={handleExportCSV}>
                            <FaDownload className="me-1" />Export CSV
                        </button>
                        <button className="btn btn-sm fw-bold btn-outline-info" onClick={() => setViewMode((v) => v === 'shelf' ? 'table' : 'shelf')}>
                            {viewMode === 'shelf' ? <><FaTable className="me-1" />Table View</> : <><FaBookOpen className="me-1" />Shelf View</>}
                        </button>
                    </div>
                </div>

                <div className="pc-stats-strip">
                    {[
                        { label: 'Total Items', value: items.length },
                        { label: 'Shelves', value: totalShelves },
                        { label: 'Loaned Out', value: loanedCount },
                        { label: 'Lost', value: lostCount },
                        { label: 'Est. Value (lei)', value: totalValue.toFixed(2) },
                    ].map(({ label, value }) => (
                        <div className="pc-stat-card" key={label}>
                            <div className="pc-stat-value">{value}</div>
                            <div className="pc-stat-label">{label}</div>
                        </div>
                    ))}
                </div>

                <div className="pc-toolbar">
                    <span style={{ fontSize: '0.8rem', color: '#6c8b99', fontWeight: 600 }}>Filters:</span>
                    <select value={filterFormat} onChange={(e) => setFilterFormat(e.target.value)}>
                        <option value="all">All Formats</option>
                        {FORMAT_OPTIONS.map((f) => <option key={f} value={f}>{f === 'none' ? 'No Format' : f.toUpperCase()}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">All Statuses</option>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'none' ? 'No Status' : s}</option>)}
                    </select>
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6c8b99' }}>
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {viewMode === 'table' && (
                    <div className="table-responsive rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,200,255,0.1)' }}>
                        <table className="table table-dark table-hover mb-0 pc-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Format</th>
                                    <th>Status</th>
                                    <th>Shelf</th>
                                    <th>Price (lei)</th>
                                    <th>Purchase Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                {item.mediaId?.posterPath && <img src={`${POSTER_SMALL}${item.mediaId.posterPath}`} alt="" style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 3 }} />}
                                                <Link to={`/movie/${item.mediaId?.externalId}`} className="pc-title-link">
                                                    {item.mediaId?.title || '—'}
                                                </Link>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${formatBadgeClass(item.format)}`}>{item.format?.toUpperCase()}</span></td>
                                        <td><span className={`badge ${statusBadgeClass(item.physicalStatus)}`}>{item.physicalStatus}</span></td>
                                        <td>#{item.shelfNumber ?? 1}</td>
                                        <td>{item.price != null ? Number(item.price).toFixed(2) : '—'}</td>
                                        <td>{item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <div className="d-flex gap-1">
                                                <button className="btn btn-sm btn-outline-info" onClick={() => setEditingItem(item)}><FaEdit /></button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemove(item._id)}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {viewMode === 'shelf' && (
                    <div className="pc-shelves-column">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            {shelves.map((shelfNumber) => (
                                <ShelfRow
                                    key={shelfNumber}
                                    shelfNumber={shelfNumber}
                                    items={shelveMap[shelfNumber] || []}
                                    onNavigate={(id) => navigate(`/movie/${id}`)}
                                    onRemoveShelf={handleRemoveShelf}
                                />
                            ))}

                            <DragOverlay>
                                {activeDragItem && (
                                    <div className="pc-drag-ghost" style={{ background: spineColour(activeDragItem._id) }}>
                                        <span className="pc-spine-title">{activeDragItem.mediaId?.title || '...'}</span>
                                    </div>
                                )}
                            </DragOverlay>
                        </DndContext>

                        <button className="pc-add-shelf-btn" onClick={handleAddShelf}>
                            <FaLayerGroup /> Add New Shelf
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PhysicalCollection;