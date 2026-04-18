import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

function MetricCard({ label, value, meta }) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <h3>{value}</h3>
      <p className="metric-meta">{meta}</p>
    </article>
  );
}

function StatusPill({ value, tone }) {
  return <span className={`pill ${tone || String(value).toLowerCase()}`}>{value}</span>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entryType, setEntryType] = useState("tenant");
  const [entryName, setEntryName] = useState("");
  const [entryPropertyId, setEntryPropertyId] = useState("");
  const [entryDetail, setEntryDetail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest("/dashboard");
      setDashboard(response);
      setSelectedPropertyId(response.properties[0]?.id || null);
      setEntryPropertyId(response.properties[0]?.id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredProperties = useMemo(() => {
    if (!dashboard) return [];

    return dashboard.properties.filter((property) => {
      const haystack = [
        property.name,
        property.address,
        property.city,
        ...property.units.map((unit) => unit.label),
        ...property.units.map((unit) => unit.tenant?.name || "")
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || property.units.some((unit) => unit.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [dashboard, searchQuery, statusFilter]);

  const selectedProperty =
    filteredProperties.find((property) => property.id === selectedPropertyId) || filteredProperties[0];

  async function handleQuickAdd(event) {
    event.preventDefault();
    setFormError("");
    const endpoint = entryType === "tenant" ? "/tenants" : "/maintenance";
    const body =
      entryType === "tenant"
        ? {
            name: entryName,
            propertyId: entryPropertyId,
            unitLabel: entryDetail
          }
        : {
            title: entryName,
            propertyId: entryPropertyId,
            priority: entryDetail || "medium"
          };

    try {
      await apiRequest(endpoint, { method: "POST", body });
      setEntryName("");
      setEntryDetail("");
      await loadDashboard();
    } catch (err) {
      setFormError(err.message);
    }
  }

  if (loading) {
    return <div className="screen-center">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="screen-center">
        <div className="detail-card">
          <div className="detail-title">Unable to load workspace</div>
          <p className="detail-subtext">{error}</p>
          <button className="primary-action" onClick={loadDashboard} type="button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Property Command Center</p>
          <h1>Harbor PM</h1>
          <p className="brand-copy">
            Welcome back, {user?.name || "Operator"}. Keep units full, revenue clean, and work orders moving.
          </p>
        </div>

        <section className="spotlight-card">
          <p className="spotlight-label">This Month</p>
          <h2>{dashboard.metrics.collectionRate}%</h2>
          <p>{dashboard.metrics.occupiedUnits} occupied units across the live portfolio.</p>
        </section>

        <section className="quick-add-card">
          <h2>Quick Add</h2>
          <form id="quick-add-form" onSubmit={handleQuickAdd}>
            <label>
              <span>Record type</span>
              <select value={entryType} onChange={(event) => setEntryType(event.target.value)}>
                <option value="tenant">Tenant</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>

            <label>
              <span>{entryType === "tenant" ? "Tenant name" : "Request title"}</span>
              <input value={entryName} onChange={(event) => setEntryName(event.target.value)} required />
            </label>

            <label>
              <span>Property</span>
              <select
                value={entryPropertyId}
                onChange={(event) => setEntryPropertyId(event.target.value)}
                required
              >
                {dashboard.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>{entryType === "tenant" ? "Unit label" : "Priority"}</span>
              <input
                value={entryDetail}
                onChange={(event) => setEntryDetail(event.target.value)}
                placeholder={entryType === "tenant" ? "3B" : "high"}
                required
              />
            </label>

            {formError ? <p className="form-error">{formError}</p> : null}

            <button className="primary-action" type="submit">
              Save entry
            </button>
          </form>
        </section>

        <button className="ghost-action" onClick={logout} type="button">
          Sign out
        </button>
      </aside>

      <main className="main-stage">
        <header className="hero-panel">
          <div>
            <p className="eyebrow">Operations Snapshot</p>
            <h2>Keep units full, rent on time, and issues moving.</h2>
          </div>

          <div className="hero-actions">
            <label className="search-wrap">
              <span className="sr-only">Search</span>
              <input
                type="search"
                placeholder="Search properties, tenants, or units"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All occupancy states</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
              <option value="notice">Notice</option>
            </select>
          </div>
        </header>

        <section className="metrics-grid">
          <MetricCard
            label="Properties"
            value={dashboard.metrics.propertyCount}
            meta={`${dashboard.metrics.totalUnits} total units under management`}
          />
          <MetricCard
            label="Occupied Units"
            value={`${dashboard.metrics.occupiedUnits}/${dashboard.metrics.totalUnits}`}
            meta={`${dashboard.metrics.occupancyRate}% of units currently leased`}
          />
          <MetricCard
            label="Vacancy Risk"
            value={dashboard.metrics.vacancyRisk}
            meta={`${dashboard.metrics.vacantUnits} vacant, ${dashboard.metrics.noticeUnits} on notice`}
          />
          <MetricCard
            label="Monthly Revenue"
            value={dashboard.metrics.totalRevenueFormatted}
            meta={`${dashboard.metrics.collectionRate}% of scheduled rent collected`}
          />
        </section>

        <section className="content-grid">
          <section className="panel panel-large">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h3>Property Performance</h3>
              </div>
              <p className="panel-note">
                {filteredProperties.length} properties shown | {dashboard.metrics.occupiedUnits} occupied units
              </p>
            </div>

            <div className="property-list">
              {filteredProperties.map((property) => (
                <article
                  key={property.id}
                  className={`property-card ${selectedProperty?.id === property.id ? "selected" : ""}`}
                  onClick={() => setSelectedPropertyId(property.id)}
                >
                  <div className="property-top">
                    <div>
                      <div className="property-name">{property.name}</div>
                      <p className="detail-subtext">
                        {property.address}, {property.city}
                      </p>
                    </div>
                    <StatusPill
                      value={`${property.occupancyRate}% occupied`}
                      tone={
                        property.occupancyRate >= 95
                          ? "occupied"
                          : property.occupancyRate >= 80
                            ? "notice"
                            : "overdue"
                      }
                    />
                  </div>
                  <div className="property-bottom">
                    <span>
                      {property.occupiedUnits}/{property.totalUnits} units leased
                    </span>
                    <span>{property.openMaintenanceCount} active requests</span>
                    <strong>{property.monthlyRevenueFormatted}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Focus Property</p>
                <h3>{selectedProperty?.name || "No property selected"}</h3>
              </div>
              <p className="panel-note">
                {selectedProperty ? `${selectedProperty.city} | ${selectedProperty.openMaintenanceCount} open work orders` : ""}
              </p>
            </div>

            <div className="detail-stack">
              {selectedProperty?.units.map((unit) => (
                <article className="detail-card" key={unit.id}>
                  <div className="detail-header">
                    <div>
                      <div className="detail-title">Unit {unit.label}</div>
                      <p className="detail-subtext">
                        {unit.beds} bed | {unit.baths} bath
                      </p>
                    </div>
                    <StatusPill value={unit.status} />
                  </div>

                  <div>
                    <div className="tenant-name">{unit.tenant?.name || "Vacant unit"}</div>
                    <p className="tenant-meta">
                      {unit.tenant?.leaseEndLabel || "Ready for listing"}
                    </p>
                  </div>

                  <div className="detail-row">
                    <span>Rent</span>
                    <span className="amount">{unit.rentFormatted}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Rent Ledger</p>
                <h3>Collections</h3>
              </div>
              <p className="panel-note">{dashboard.payments.length} latest entries</p>
            </div>

            <div className="list-stack">
              {dashboard.payments.map((payment) => (
                <article className="list-item" key={payment.id}>
                  <div>
                    <div className="tenant-name">{payment.tenantName}</div>
                    <p className="tenant-meta">
                      {payment.propertyName} | Due {payment.dueDateLabel}
                    </p>
                  </div>
                  <div>
                    <div className="amount">{payment.amountFormatted}</div>
                    <StatusPill value={payment.status} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Maintenance</p>
                <h3>Open Requests</h3>
              </div>
              <p className="panel-note">
                {dashboard.metrics.highPriorityMaintenance} high priority | {dashboard.maintenance.length} open items
              </p>
            </div>

            <div className="list-stack">
              {dashboard.maintenance.map((request) => (
                <article className="list-item" key={request.id}>
                  <div>
                    <div className="request-title">{request.title}</div>
                    <p className="request-meta">
                      {request.propertyName} | {request.unit} | {request.status}
                    </p>
                  </div>
                  <StatusPill value={request.priority} />
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
