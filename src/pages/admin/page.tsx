'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BarChart3, Bell, Boxes, Bot, ChevronDown, CircleHelp, FolderKanban, LayoutDashboard, Menu, MoreHorizontal, Package, Plus, Search, Settings2, Shirt, ShoppingBag, SlidersHorizontal, Sparkles, Star, Tag, Users, X, Megaphone, Store, Lock, ShieldAlert, LogOut, KeyRound, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import './admin.css'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Products', icon: Package }, { label: 'Categories', icon: FolderKanban }, { label: 'Inventory', icon: Boxes }, { label: 'Orders', icon: ShoppingBag, count: '24' }, { label: 'Customers', icon: Users }, { label: 'Reviews', icon: Star }, { label: 'Promotions', icon: Megaphone }, { label: 'Analytics', icon: BarChart3 }, { label: 'AI Shopping Assistant', icon: Bot }, { label: 'AI Personal Stylist', icon: Sparkles }, { label: 'Virtual Try-On', icon: Shirt }, { label: 'Notifications', icon: Bell }, { label: 'Settings', icon: Settings2 },
]
const orders = [
  { id: '#VS-10482', customer: 'Maya Chen', item: 'Silk column dress', price: '$420.00', status: 'Paid', tone: 'green', initials: 'MC' }, { id: '#VS-10481', customer: 'Elliot Moss', item: 'Arc lounge chair', price: '$1,280.00', status: 'Processing', tone: 'yellow', initials: 'EM' }, { id: '#VS-10480', customer: 'Amina Okafor', item: 'Ribbed glass set', price: '$186.00', status: 'Paid', tone: 'green', initials: 'AO' }, { id: '#VS-10479', customer: 'Jon Bell', item: 'Monument vase', price: '$310.00', status: 'Shipped', tone: 'blue', initials: 'JB' },
]
const pageCopy: Record<string, { eyebrow: string; title: string; description: string; action: string; total: string; active: string; attention: string }> = {
  Products: { eyebrow: 'Commerce', title: 'Products', description: 'Manage your catalog, product information, and inventory visibility.', action: 'Add product', total: '1,842', active: '1,706 live', attention: '18 drafts' },
  Categories: { eyebrow: 'Commerce', title: 'Categories', description: 'Organize the collection into clear, shoppable worlds.', action: 'Add category', total: '38', active: '31 active', attention: '4 empty' },
  Inventory: { eyebrow: 'Commerce', title: 'Inventory', description: 'Keep every product and variant available at a glance.', action: 'Stock intake', total: '12,480', active: '11,920 in stock', attention: '24 low stock' },
  Orders: { eyebrow: 'Commerce', title: 'Orders', description: 'Track fulfillment from first click to final delivery.', action: 'Create order', total: '286', active: '214 fulfilled', attention: '24 pending' },
  Customers: { eyebrow: 'Commerce', title: 'Customers', description: 'Understand the people shaping your studio commerce.', action: 'Add customer', total: '1,842', active: '1,204 returning', attention: '12 VIP leads' },
  Reviews: { eyebrow: 'Commerce', title: 'Reviews', description: 'Curate customer feedback and keep the conversation moving.', action: 'Request review', total: '428', active: '4.8 average', attention: '16 to review' },
  Promotions: { eyebrow: 'Marketing', title: 'Promotions', description: 'Create considered offers that feel native to the brand.', action: 'Create promotion', total: '12', active: '8 running', attention: '2 ending soon' },
  Analytics: { eyebrow: 'Analytics', title: 'Analytics', description: 'Read the signals behind revenue, products, and customers.', action: 'Export report', total: '$48,294', active: '+18.6% revenue', attention: '4.82% conversion' },
  'AI Shopping Assistant': { eyebrow: 'AI Experience', title: 'AI Shopping Assistant', description: 'Review conversations and tune how VESTRA helps customers discover.', action: 'New playbook', total: '1,284', active: '94% resolved', attention: '18 escalations' },
  'AI Personal Stylist': { eyebrow: 'AI Experience', title: 'AI Personal Stylist', description: 'Build intelligent looks around occasion, season, and personal style.', action: 'Create lookbook', total: '642', active: '88% saved', attention: '6 drafts' },
  'Virtual Try-On': { eyebrow: 'AI Experience', title: 'Virtual Try-On', description: 'Monitor sessions and product compatibility.', action: 'Add experience', total: '3,892', active: '72% engagement', attention: '14 products' },
  Notifications: { eyebrow: 'System', title: 'Notifications', description: 'Stay close to the events that need your attention.', action: 'Create alert', total: '24', active: '18 unread', attention: '3 urgent' },
  Settings: { eyebrow: 'System', title: 'Settings', description: 'Shape your store, experience, and operational preferences.', action: 'Add team member', total: '4', active: '3 admins', attention: '1 invite pending' },
}

function Metric({ label, value, note, negative = false }: { label: string; value: string; note: string; negative?: boolean }) { return <article className="metric-card"><div className="metric-heading"><span>{label}</span><span className="metric-icon"><ArrowUpRight size={16} /></span></div><div className="metric-value">{value}</div><div className="metric-footer"><span className={negative ? 'negative' : 'positive'}>{note}</span><span>vs. last month</span></div></article> }
function TablePanel({ title, eyebrow }: { title: string; eyebrow: string }) { const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const pageSize = 4; const filteredOrders = orders.filter((order) => `${order.id} ${order.customer} ${order.item} ${order.status}`.toLowerCase().includes(search.toLowerCase())); const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize)); const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize); return <article className="panel orders-panel"><div className="panel-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button className="text-button">View all <ArrowUpRight size={15} /></button></div><div className="table-toolbar"><div className="table-search"><Search size={15} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder={`Search ${title.toLowerCase()}`} aria-label={`Search ${title}`} /></div><div className="table-actions"><span className="result-count">{filteredOrders.length} results</span><button className="select-button"><SlidersHorizontal size={14} /> Filters</button></div></div><div className="table-wrap"><table><thead><tr><th>Reference</th><th>Customer</th><th>Item</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{visibleOrders.length ? visibleOrders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong></td><td><div className="customer"><span className="customer-avatar">{order.initials}</span>{order.customer}</div></td><td className="muted-cell">{order.item}</td><td><strong>{order.price}</strong></td><td><span className={`status ${order.tone}`}><i />{order.status}</span></td><td><button className="row-more" aria-label={`More options for ${order.id}`}><MoreHorizontal size={16} /></button></td></tr>) : <tr><td colSpan={6} className="empty-row">No records match your search.</td></tr>}</tbody></table></div><div className="table-pagination"><span>Showing {visibleOrders.length} of {filteredOrders.length}</span><div className="pagination-controls"><button className="pagination-button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">Previous</button><span>Page {page} of {pageCount}</span><button className="pagination-button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page">Next</button></div></div></article> }
function Overview() { return <><div className="welcome-row"><div><p className="eyebrow">Monday, 14 October 2024</p><h1>Good morning, Alex<span>.</span></h1><p className="subheading">Here&apos;s the pulse of your studio today.</p></div><button className="primary-button" data-add="product"><Plus size={16} /> Add product</button></div><div className="metric-grid"><Metric label="Gross revenue" value="$48,294.80" note="+18.6%" /><Metric label="Orders" value="286" note="+12.4%" /><Metric label="Customers" value="1,842" note="+8.2%" /><Metric label="Conversion" value="4.82%" note="−0.6%" negative /></div><div className="dashboard-grid"><article className="panel revenue-panel"><div className="panel-header"><div><p className="eyebrow">Performance</p><h2>Revenue overview</h2></div><button className="select-button">Last 30 days <ChevronDown size={14} /></button></div><div className="chart"><div className="chart-y"><span>$12k</span><span>$8k</span><span>$4k</span><span>$0</span></div><div className="chart-main"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 700 230" preserveAspectRatio="none" aria-label="Revenue chart" role="img"><path className="chart-area" d="M0,188 C35,178 45,135 82,151 S124,160 150,137 S188,111 214,127 S254,148 281,108 S325,95 351,112 S383,152 420,127 S452,80 487,92 S519,110 547,76 S590,54 614,67 S653,35 700,20 V230 H0 Z" /><path className="chart-line" d="M0,188 C35,178 45,135 82,151 S124,160 150,137 S188,111 214,127 S254,148 281,108 S325,95 351,112 S383,152 420,127 S452,80 487,92 S519,110 547,76 S590,54 614,67 S653,35 700,20" /></svg><div className="chart-x"><span>Sep 15</span><span>Sep 20</span><span>Sep 25</span><span>Sep 30</span><span>Oct 05</span><span>Oct 10</span><span>Oct 14</span></div></div></div></article><article className="panel channel-panel"><div className="panel-header"><div><p className="eyebrow">Acquisition</p><h2>Top channels</h2></div><MoreHorizontal size={18} className="muted-icon" /></div><div className="donut-wrap"><div className="donut"><div><strong>4,892</strong><span>visitors</span></div></div><div className="legend"><div><i className="dot lime-dot" /><span>Direct</span><b>42%</b></div><div><i className="dot blue-dot" /><span>Instagram</span><b>31%</b></div><div><i className="dot cream-dot" /><span>Search</span><b>18%</b></div><div><i className="dot gray-dot" /><span>Other</span><b>9%</b></div></div></div></article></div><TablePanel title="Recent orders" eyebrow="Activity" /></> }
function VirtualTryOnPage({ onAdd }: { onAdd: () => void }) { return <div className="page-transition tryon-page"><div className="welcome-row"><div><p className="eyebrow">AI Experience</p><h1>Virtual Try-On</h1><p className="subheading">Shape a more confident path from inspiration to checkout with live fit experiences.</p></div><button className="primary-button" onClick={onAdd}><Plus size={16} /> Add experience</button></div><div className="tryon-hero-grid"><article className="panel tryon-stage"><div className="panel-header"><div><p className="eyebrow">Live preview</p><h2>Studio fitting room</h2></div><span className="live-pill"><i /> Live</span></div><div className="tryon-preview"><div className="tryon-silhouette"><div className="silhouette-head" /><div className="silhouette-body" /><div className="silhouette-leg left" /><div className="silhouette-leg right" /></div><div className="tryon-tag tag-one"><span>Fit confidence</span><strong>92%</strong></div><div className="tryon-tag tag-two"><span>Recommended</span><strong>Silk column dress</strong></div></div><div className="tryon-controls"><button className="tryon-control active">Front</button><button className="tryon-control">Side</button><button className="tryon-control">Back</button><button className="tryon-control tryon-upload">Upload model <Plus size={14} /></button></div></article><div className="tryon-side-stack"><article className="panel tryon-stat-card"><p className="eyebrow">This month</p><div className="tryon-stat-value">3,892</div><p>sessions started</p><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></article><article className="panel compatibility-card"><div className="panel-header"><div><p className="eyebrow">Catalog health</p><h2>Compatibility</h2></div><ArrowUpRight size={16} /></div><div className="compatibility-row"><span>Ready for try-on</span><strong>72%</strong></div><div className="compatibility-track"><i /></div><p className="muted-copy">14 products need model mapping before they can go live.</p><button className="text-button">Review catalog <ArrowUpRight size={15} /></button></article></div></div><div className="panel tryon-activity"><div className="panel-header"><div><p className="eyebrow">Recent sessions</p><h2>Experience activity</h2></div><button className="text-button">View analytics <ArrowUpRight size={15} /></button></div><div className="session-list"><div><span className="session-avatar">MC</span><p><strong>Maya Chen</strong><small>Silk column dress · 2 min ago</small></p><b className="session-score">94%</b></div><div><span className="session-avatar warm">AO</span><p><strong>Amina Okafor</strong><small>Arc lounge chair · 18 min ago</small></p><b className="session-score">88%</b></div><div><span className="session-avatar blue">JB</span><p><strong>Jon Bell</strong><small>Monument vase · 42 min ago</small></p><b className="session-score">91%</b></div></div></div></div> }

function LookbookSlider() { const looks = [{ title: <>Quiet<br />occasion</>, detail: 'Silk, warm neutrals, a clean line.', pieces: '4 pieces', rate: '88% save rate', tone: 'look-tone-sage' }, { title: <>Gallery<br />after-hours</>, detail: 'Ink tailoring, a silver note, soft contrast.', pieces: '5 pieces', rate: '91% save rate', tone: 'look-tone-ink' }, { title: <>Sunlit<br />weekend</>, detail: 'Washed linen, citrus light, an easy stride.', pieces: '3 pieces', rate: '84% save rate', tone: 'look-tone-sand' }, { title: <>Dinner<br />in motion</>, detail: 'Fluid satin, sculpted shoulders, a low glow.', pieces: '4 pieces', rate: '86% save rate', tone: 'look-tone-amber' }]; const [index, setIndex] = useState(0); const look = looks[index]; const move = (direction: number) => setIndex((index + direction + looks.length) % looks.length); return <div className="lookbook-slider" aria-label="Curated lookbook slider"><div className={`look-slide ${look.tone}`} key={index}><div className="look-slide-top"><span>0{index + 1} / 04</span><span>CURATED SET</span></div><div className="look-slide-content"><div><strong>{look.title}</strong><small>{look.detail}</small></div><div className="look-slide-meta"><span><b>{look.pieces}</b> edited for this mood</span><span><b>{look.rate}</b></span></div></div></div><div className="lookbook-slider-footer"><div className="lookbook-dots" role="tablist" aria-label="Choose a look"><button className="slider-arrow" onClick={() => move(-1)} aria-label="Previous look">←</button>{looks.map((item, itemIndex) => <button key={item.title.toString()} className={`look-dot ${itemIndex === index ? 'active' : ''}`} onClick={() => setIndex(itemIndex)} aria-label={`Show look ${itemIndex + 1}`} aria-selected={itemIndex === index} />)}<button className="slider-arrow" onClick={() => move(1)} aria-label="Next look">→</button></div><span className="slider-caption">Swipe through your next point of view</span></div></div> }

function ExperiencePage({ active, onAdd }: { active: 'AI Shopping Assistant' | 'AI Personal Stylist'; onAdd: () => void }) { const stylist = active === 'AI Personal Stylist'; return <div className={`page-transition experience-page ${stylist ? 'stylist-page' : 'assistant-page'}`}><div className="experience-hero"><div><p className="eyebrow">AI Experience / {stylist ? 'Look direction' : 'Concierge intelligence'}</p><h1>{stylist ? 'Personal style, composed.' : 'A smarter way to shop.'}</h1><p className="subheading">{stylist ? 'Turn a customer profile into complete, shoppable looks with a point of view.' : 'Give every shopper a thoughtful answer, from first question to final recommendation.'}</p></div><button className="primary-button" onClick={onAdd}><Plus size={16} /> {stylist ? 'Create lookbook' : 'New playbook'}</button></div><div className="experience-grid"><article className="panel experience-console"><div className="panel-header"><div><p className="eyebrow">{stylist ? 'Latest edit' : 'Live conversation'}</p><h2>{stylist ? 'The soft structure edit' : 'Concierge queue'}</h2></div><span className="live-pill"><i /> {stylist ? 'Ready to publish' : 'Online now'}</span></div>{stylist ? <LookbookSlider /> : <div className="conversation-preview"><div className="chat-bubble customer-bubble">I need something for a gallery opening, but not too formal.</div><div className="chat-bubble assistant-bubble">Try a clean column silhouette with one sculptural detail. I pulled three options from your saved palette.</div><div className="chat-suggestion"><Sparkles size={15} /> Three recommendations ready</div></div>}</article><div className="experience-side"><article className="panel experience-stat"><p className="eyebrow">{stylist ? 'Lookbooks this month' : 'Conversations today'}</p><strong>{stylist ? '642' : '1,284'}</strong><span>{stylist ? '+16.4% saved' : '94% resolved without handoff'}</span><div className="pulse-bars"><i /><i /><i /><i /><i /><i /></div></article><article className="panel signal-list"><div className="panel-header"><div><p className="eyebrow">Signals</p><h2>{stylist ? 'Style signals' : 'Assistant health'}</h2></div><ArrowUpRight size={16} /></div><div className="signal-row"><span>{stylist ? 'Minimal / refined' : 'Intent understood'}</span><strong>92%</strong></div><div className="signal-row"><span>{stylist ? 'Warm neutrals' : 'Product matches'}</span><strong>88%</strong></div><div className="signal-row"><span>{stylist ? 'Occasion ready' : 'Escalations'}</span><strong className="signal-accent">{stylist ? '76%' : '18'}</strong></div></article></div></div></div> }

function CollectionPage({ active, onAdd }: { active: string; onAdd: () => void }) { if (active === 'AI Shopping Assistant' || active === 'AI Personal Stylist') return <ExperiencePage active={active} onAdd={onAdd} />; const copy = pageCopy[active]; const guide: Record<string, { label: string; detail: string }[]> = { Products: [{ label: 'Catalog', detail: 'Add, edit, publish, and organize every product.' }, { label: 'Visibility', detail: 'Control what shoppers can discover right now.' }, { label: 'Next step', detail: 'Start by adding a product or reviewing drafts.' }], Orders: [{ label: 'Workflow', detail: 'Move orders from payment through delivery.' }, { label: 'Attention', detail: 'Prioritize pending, delayed, or refunded orders.' }, { label: 'Next step', detail: 'Open an order to update its fulfillment status.' }], Analytics: [{ label: 'Signals', detail: 'Track revenue, conversion, and channel performance.' }, { label: 'Decisions', detail: 'Use trends to plan inventory and campaigns.' }, { label: 'Next step', detail: 'Choose a date range to compare performance.' }] }; const guideItems = guide[active] ?? [{ label: 'Purpose', detail: copy.description }, { label: 'Manage', detail: `Review and update your ${active.toLowerCase()} workspace.` }, { label: 'Next step', detail: `Use ${copy.action.toLowerCase()} to keep this area current.` }]; return <div className="page-transition"><div className="welcome-row"><div><p className="eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p className="subheading">{copy.description}</p></div><button className="primary-button" onClick={onAdd}><Plus size={16} /> {copy.action}</button></div><section className="workspace-guide" aria-label={`${copy.title} workspace guide`}><div className="guide-intro"><span className="guide-kicker">Workspace guide</span><h2>What you can do here</h2><p>This is your control room for {active.toLowerCase()}. Keep the essentials visible, then take action from the workspace below.</p></div><div className="guide-steps">{guideItems.map((item, index) => <div className="guide-step" key={item.label}><span>0{index + 1}</span><div><strong>{item.label}</strong><p>{item.detail}</p></div></div>)}</div></section><div className="metric-grid"><Metric label={`Total ${active.toLowerCase()}`} value={copy.total} note="+12.4%" /><Metric label="Active now" value={copy.active} note="+8.1%" /><Metric label="Needs attention" value={copy.attention} note="−2.4%" negative /></div><TablePanel title={active} eyebrow={copy.eyebrow} /></div> }

function AdminAccessDenied({ user, signOut }: { user: any; signOut: () => Promise<any> }) {
  return (
    <main className="admin-gate-shell danger-shell">
      <div className="admin-gate-card">
        <div className="gate-icon-badge danger">
          <ShieldAlert size={34} />
        </div>
        <span className="gate-tag danger">Access Restricted · HTTP 403</span>
        <h1 className="gate-title">Access Denied</h1>
        <p className="gate-desc">
          Account <strong>{user?.email || 'authenticated via Google'}</strong> is logged in through Google OAuth.
          Shopper accounts are strictly restricted from the Vestra Studio Administrative Workspace.
        </p>

        <div className="gate-callout danger-callout">
          <p className="callout-title">Security Policy Enforced</p>
          <p className="callout-body">
            Administrative access (inventory, orders, catalog records, and AI models) requires dedicated studio credentials. Retail customer profiles cannot access administrative controls.
          </p>
        </div>

        <div className="gate-actions">
          <Link to="/" className="gate-primary-btn">
            Return to Storefront
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="gate-secondary-btn danger-btn"
          >
            <LogOut size={15} /> Sign Out of Account
          </button>
        </div>
      </div>
    </main>
  );
}

function AdminPasskeyGate({ onVerify }: { onVerify: (code: string) => boolean }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the studio master passkey.');
      return;
    }
    const success = onVerify(code);
    if (!success) {
      setError('Invalid passkey. Access denied.');
    }
  };

  return (
    <main className="admin-gate-shell">
      <div className="admin-gate-card">
        <div className="gate-icon-badge">
          <Lock size={32} />
        </div>
        <span className="gate-tag">Studio Security Gate</span>
        <h1 className="gate-title">Admin Passkey</h1>
        <p className="gate-desc">
          Enter the Vestra Studio master passkey to unlock the administrative workspace.
        </p>

        <form onSubmit={handleSubmit} className="gate-form">
          <div className="gate-input-wrap">
            <KeyRound size={17} />
            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Enter master passkey..."
              autoFocus
            />
          </div>
          {error && <p className="gate-error-msg">{error}</p>}
          <button type="submit" className="gate-primary-btn">
            Unlock Studio <ArrowRight size={16} />
          </button>
        </form>

        <div className="gate-footer">
          <span className="hint-text">Master Key: <code>vestra-admin</code></span>
          <Link to="/" className="back-link">
            ← Return to Storefront
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  const { user, isGoogleUser, isAdmin, verifyAdminPasscode, logoutAdmin, signOut, loading } = useAuth();
  const [active, setActive] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [query, setQuery] = useState('');
  const copy = pageCopy[active];

  // 1. Loading state
  if (loading) {
    return (
      <main className="admin-gate-shell">
        <div className="admin-loader-spinner" />
        <p className="admin-loader-text">Verifying studio credentials...</p>
      </main>
    );
  }

  // 2. STRICT RULE: Any user logging in with Google must NOT have access to the admin panel
  if (isGoogleUser) {
    return <AdminAccessDenied user={user} signOut={signOut} />;
  }

  // 3. Admin passkey verification gate
  if (!isAdmin) {
    return <AdminPasskeyGate onVerify={verifyAdminPasscode} />;
  }

  // 4. Authenticated Studio Administrator
  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline" title="Back to Storefront">
            <div className="brand-mark">V</div>
            <div>
              <p className="brand-name">vestra</p>
              <p className="brand-sub">studio commerce</p>
            </div>
          </Link>
          <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">VS</div>
          <div className="workspace-copy">
            <span>Vestra Studio</span>
            <small>Production workspace</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <p className="nav-label">Workspace</p>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${active === item.label ? 'nav-active' : ''}`}
                onClick={() => {
                  setActive(item.label);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.count && <b>{item.count}</b>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={17} />
            <div>
              <strong>Need a hand?</strong>
              <span>Visit the help center</span>
            </div>
            <ArrowUpRight size={14} />
          </div>

          <div className="profile">
            <div className="profile-avatar">AR</div>
            <div>
              <strong>Alex Rivera</strong>
              <span>Administrator</span>
            </div>
            <button
              onClick={() => logoutAdmin()}
              className="icon-button"
              title="Lock Admin Workspace"
              aria-label="Lock Admin Workspace"
            >
              <Lock size={15} />
            </button>
          </div>

          <div className="sidebar-exit-row">
            <Link to="/" className="exit-store-btn" title="Back to Storefront">
              <Store size={13} />
              <span>Exit to Store</span>
            </Link>
            <button
              onClick={() => logoutAdmin()}
              className="lock-admin-btn"
              title="Lock Session"
            >
              <LogOut size={12} />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      <section className="content-area">
        <header className="topbar">
          <button className="icon-button menu-trigger" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="crumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>{active}</strong>
          </div>
          <div className="top-actions">
            <div className="search-wrap">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search anything" aria-label="Search anything" />
            </div>
            <button className="icon-button notification" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <div className="mini-avatar">AR</div>
          </div>
        </header>

        <div className="page-content" key={active}>
          {active === 'Overview' ? <Overview /> : active === 'Virtual Try-On' ? <VirtualTryOnPage onAdd={() => setModal(true)} /> : <CollectionPage active={active} onAdd={() => setModal(true)} />}
        </div>
      </section>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setModal(false)}>
          <section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" onClick={() => setModal(false)} aria-label="Close dialog">
              <X size={18} />
            </button>
            <p className="eyebrow">{copy?.eyebrow || 'Commerce'}</p>
            <h2 id="modal-title">{copy?.action || 'Add product'}</h2>
            <p className="modal-copy">Start with the essentials. You can refine the details and publish whenever you&apos;re ready.</p>
            <label>
              Name
              <input autoFocus placeholder={`Enter ${active === 'Overview' ? 'product' : active.toLowerCase()} name`} />
            </label>
            <label>
              Short description
              <textarea placeholder="Add a clear description" rows={3} />
            </label>
            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary-button" onClick={() => setModal(false)}>Create {active === 'Overview' ? 'product' : active.toLowerCase()}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
