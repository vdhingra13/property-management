import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL, apiRequest } from "../lib/api";

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

function emptyPropertyForm() {
  return {
    code: "",
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    propertyType: "Apartment",
    ownershipName: "",
    notes: ""
  };
}

function emptyUnitForm(propertyId = "") {
  return {
    propertyId,
    label: "",
    floor: "",
    beds: 1,
    baths: 1,
    squareFeet: "",
    marketRent: "",
    rent: "",
    securityDepositTarget: "",
    status: "vacant",
    availableFrom: "",
    notes: ""
  };
}

function emptyTenantForm(propertyId = "", unitId = "") {
  return {
    propertyId,
    unitId,
    name: "",
    preferredName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    governmentIdType: "",
    governmentIdNumber: "",
    policeVerificationStatus: "pending",
    emergencyContactName: "",
    emergencyContactPhone: "",
    permanentAddress: "",
    leaseEnd: "",
    notes: ""
  };
}

function emptyLeaseForm(propertyId = "", unitId = "", tenantId = "") {
  return {
    propertyId,
    unitId,
    tenantId,
    status: "active",
    startDate: "",
    endDate: "",
    moveInDate: "",
    monthlyRent: "",
    securityDeposit: "",
    depositReceivedDate: "",
    rentDueDay: 1,
    lateFeeType: "flat",
    lateFeeAmount: "",
    billingFrequency: "monthly",
    renewalStatus: "fixed_term",
    noticePeriodDays: 30,
    petTerms: "",
    parkingTerms: "",
    utilityResponsibility: "",
    notes: ""
  };
}

function emptyDocumentForm(entityType = "tenant", entityId = "") {
  return {
    entityType,
    entityId,
    title: "",
    documentType: "lease_signed",
    file: null
  };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState("");
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [unitForm, setUnitForm] = useState(emptyUnitForm());
  const [tenantForm, setTenantForm] = useState(emptyTenantForm());
  const [leaseForm, setLeaseForm] = useState(emptyLeaseForm());
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm());

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/dashboard");
      setWorkspace(response);

      const defaultPropertyId = response.properties[0]?.id || "";
      const defaultVacantUnitId =
        response.properties
          .flatMap((property) => property.units.map((unit) => ({ ...unit, propertyId: property.id })))
          .find((unit) => !unit.tenantName)?.id || "";
      const defaultTenantId = response.tenants[0]?.id || "";
      const defaultLeaseId = response.leases[0]?.id || "";

      setUnitForm((current) => ({ ...current, propertyId: current.propertyId || defaultPropertyId }));
      setTenantForm((current) => ({
        ...current,
        propertyId: current.propertyId || defaultPropertyId,
        unitId: current.unitId || defaultVacantUnitId
      }));
      setLeaseForm((current) => ({
        ...current,
        propertyId: current.propertyId || defaultPropertyId,
        unitId: current.unitId || defaultVacantUnitId,
        tenantId: current.tenantId || defaultTenantId
      }));
      setDocumentForm((current) => ({
        ...current,
        entityId: current.entityId || (current.entityType === "tenant" ? defaultTenantId : defaultLeaseId)
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const availableUnits = useMemo(() => {
    if (!workspace) return [];

    return workspace.properties
      .flatMap((property) =>
        property.units.map((unit) => ({
          ...unit,
          propertyId: property.id,
          propertyName: property.name
        }))
      )
      .filter((unit) => !unit.tenantName || unit.id === leaseForm.unitId || unit.id === tenantForm.unitId);
  }, [leaseForm.unitId, tenantForm.unitId, workspace]);

  const leaseUnits = useMemo(
    () => availableUnits.filter((unit) => !leaseForm.propertyId || unit.propertyId === leaseForm.propertyId),
    [availableUnits, leaseForm.propertyId]
  );

  const tenantUnits = useMemo(
    () => availableUnits.filter((unit) => !tenantForm.propertyId || unit.propertyId === tenantForm.propertyId),
    [availableUnits, tenantForm.propertyId]
  );

  const entityOptions = useMemo(() => {
    if (!workspace) return [];
    return documentForm.entityType === "tenant" ? workspace.tenants : workspace.leases;
  }, [documentForm.entityType, workspace]);

  async function submitJson(key, callback) {
    setSubmitting(key);
    setFormError("");

    try {
      await callback();
      await loadWorkspace();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting("");
    }
  }

  async function handlePropertySubmit(event) {
    event.preventDefault();
    await submitJson("property", async () => {
      await apiRequest("/properties", { method: "POST", body: propertyForm });
      setPropertyForm(emptyPropertyForm());
    });
  }

  async function handleUnitSubmit(event) {
    event.preventDefault();
    await submitJson("unit", async () => {
      await apiRequest(`/properties/${unitForm.propertyId}/units`, { method: "POST", body: unitForm });
      setUnitForm(emptyUnitForm(unitForm.propertyId));
    });
  }

  async function handleTenantSubmit(event) {
    event.preventDefault();
    await submitJson("tenant", async () => {
      await apiRequest("/tenants", { method: "POST", body: tenantForm });
      setTenantForm(emptyTenantForm(tenantForm.propertyId));
    });
  }

  async function handleLeaseSubmit(event) {
    event.preventDefault();
    await submitJson("lease", async () => {
      await apiRequest("/leases", { method: "POST", body: leaseForm });
      setLeaseForm(emptyLeaseForm(leaseForm.propertyId));
    });
  }

  async function handleDocumentSubmit(event) {
    event.preventDefault();
    await submitJson("document", async () => {
      const formData = new FormData();
      formData.append("entityType", documentForm.entityType);
      formData.append("entityId", documentForm.entityId);
      formData.append("title", documentForm.title);
      formData.append("documentType", documentForm.documentType);
      formData.append("file", documentForm.file);
      await apiRequest("/documents", { method: "POST", body: formData });
      setDocumentForm(emptyDocumentForm(documentForm.entityType));
    });
  }

  if (loading) {
    return <div className="screen-center">Loading management workspace...</div>;
  }

  if (error || !workspace) {
    return (
      <div className="screen-center">
        <div className="detail-card">
          <div className="detail-title">Unable to load Harbor PM</div>
          <p className="detail-subtext">{error || "Unknown error"}</p>
          <button className="primary-action" onClick={loadWorkspace} type="button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell workspace-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Property Operations</p>
          <h1>Harbor PM</h1>
          <p className="brand-copy">
            Welcome back, {user?.name || "Operator"}. This workspace is now centered on properties,
            leases, tenants, and documents.
          </p>
        </div>

        <section className="spotlight-card">
          <p className="spotlight-label">Phase 1</p>
          <h2>{workspace.metrics.propertyCount}</h2>
          <p>{workspace.metrics.activeLeases} active leases and {workspace.metrics.documentCount} stored documents.</p>
        </section>

        <section className="quick-add-card">
          <h2>Storage</h2>
          <p className="detail-subtext">
            Provider: <strong>{workspace.storage.provider}</strong>
          </p>
          <p className="detail-subtext">
            Google Cloud Storage is not wired yet. We are currently using local pilot storage so we can
            build the workflows first.
          </p>
        </section>

        <section className="quick-add-card">
          <h2>What Next</h2>
          <p className="detail-subtext">
            The next setup milestone will be switching `STORAGE_PROVIDER` from `local` to Google Cloud
            once you have the bucket ready.
          </p>
        </section>

        <button className="ghost-action" onClick={logout} type="button">
          Sign out
        </button>
      </aside>

      <main className="main-stage">
        <header className="hero-panel">
          <div>
            <p className="eyebrow">Management Workspace</p>
            <h2>Set up the portfolio, then attach tenants, leases, and documents.</h2>
          </div>
          <p className="panel-note">
            Designed for pilot operations now, with cloud storage abstraction ready for Google next.
          </p>
        </header>

        <section className="metrics-grid">
          <MetricCard
            label="Properties"
            value={workspace.metrics.propertyCount}
            meta={`${workspace.metrics.totalUnits} units configured`}
          />
          <MetricCard
            label="Leases"
            value={workspace.metrics.activeLeases}
            meta={`${workspace.metrics.expiringLeases} expiring in 60 days`}
          />
          <MetricCard
            label="Tenants"
            value={workspace.metrics.tenantCount}
            meta={`${workspace.metrics.occupiedUnits} occupied units`}
          />
          <MetricCard
            label="Scheduled Rent"
            value={workspace.metrics.scheduledRentFormatted}
            meta={`${workspace.metrics.documentCount} documents tracked`}
          />
        </section>

        {formError ? <p className="form-error global-error">{formError}</p> : null}

        <section className="management-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 1</p>
                <h3>Add Property</h3>
              </div>
            </div>
            <form className="form-grid" onSubmit={handlePropertySubmit}>
              <input placeholder="Code" value={propertyForm.code} onChange={(event) => setPropertyForm({ ...propertyForm, code: event.target.value })} />
              <input placeholder="Property name" value={propertyForm.name} onChange={(event) => setPropertyForm({ ...propertyForm, name: event.target.value })} required />
              <input className="span-2" placeholder="Address line 1" value={propertyForm.addressLine1} onChange={(event) => setPropertyForm({ ...propertyForm, addressLine1: event.target.value })} required />
              <input className="span-2" placeholder="Address line 2" value={propertyForm.addressLine2} onChange={(event) => setPropertyForm({ ...propertyForm, addressLine2: event.target.value })} />
              <input placeholder="City" value={propertyForm.city} onChange={(event) => setPropertyForm({ ...propertyForm, city: event.target.value })} required />
              <input placeholder="State" value={propertyForm.state} onChange={(event) => setPropertyForm({ ...propertyForm, state: event.target.value })} />
              <input placeholder="Postal code" value={propertyForm.postalCode} onChange={(event) => setPropertyForm({ ...propertyForm, postalCode: event.target.value })} />
              <input placeholder="Country" value={propertyForm.country} onChange={(event) => setPropertyForm({ ...propertyForm, country: event.target.value })} />
              <input placeholder="Property type" value={propertyForm.propertyType} onChange={(event) => setPropertyForm({ ...propertyForm, propertyType: event.target.value })} />
              <input placeholder="Ownership/entity" value={propertyForm.ownershipName} onChange={(event) => setPropertyForm({ ...propertyForm, ownershipName: event.target.value })} />
              <textarea className="span-2" placeholder="Notes" value={propertyForm.notes} onChange={(event) => setPropertyForm({ ...propertyForm, notes: event.target.value })} rows={3} />
              <button className="primary-action span-2" type="submit" disabled={submitting === "property"}>
                {submitting === "property" ? "Saving property..." : "Save property"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <h3>Add Unit</h3>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleUnitSubmit}>
              <select value={unitForm.propertyId} onChange={(event) => setUnitForm({ ...unitForm, propertyId: event.target.value })} required>
                <option value="">Select property</option>
                {workspace.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <input placeholder="Unit label" value={unitForm.label} onChange={(event) => setUnitForm({ ...unitForm, label: event.target.value })} required />
              <input placeholder="Floor" value={unitForm.floor} onChange={(event) => setUnitForm({ ...unitForm, floor: event.target.value })} />
              <select value={unitForm.status} onChange={(event) => setUnitForm({ ...unitForm, status: event.target.value })}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="notice">Notice</option>
              </select>
              <input type="number" min="0" placeholder="Beds" value={unitForm.beds} onChange={(event) => setUnitForm({ ...unitForm, beds: event.target.value })} />
              <input type="number" min="0" step="0.5" placeholder="Baths" value={unitForm.baths} onChange={(event) => setUnitForm({ ...unitForm, baths: event.target.value })} />
              <input type="number" min="0" placeholder="Square feet" value={unitForm.squareFeet} onChange={(event) => setUnitForm({ ...unitForm, squareFeet: event.target.value })} />
              <input type="number" min="0" placeholder="Market rent" value={unitForm.marketRent} onChange={(event) => setUnitForm({ ...unitForm, marketRent: event.target.value })} />
              <input type="number" min="0" placeholder="Current rent" value={unitForm.rent} onChange={(event) => setUnitForm({ ...unitForm, rent: event.target.value })} required />
              <input type="number" min="0" placeholder="Deposit target" value={unitForm.securityDepositTarget} onChange={(event) => setUnitForm({ ...unitForm, securityDepositTarget: event.target.value })} />
              <input type="date" value={unitForm.availableFrom} onChange={(event) => setUnitForm({ ...unitForm, availableFrom: event.target.value })} />
              <textarea className="span-2" placeholder="Unit notes" value={unitForm.notes} onChange={(event) => setUnitForm({ ...unitForm, notes: event.target.value })} rows={3} />
              <button className="primary-action span-2" type="submit" disabled={submitting === "unit"}>
                {submitting === "unit" ? "Saving unit..." : "Save unit"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h3>Register Tenant</h3>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleTenantSubmit}>
              <select value={tenantForm.propertyId} onChange={(event) => setTenantForm({ ...tenantForm, propertyId: event.target.value, unitId: "" })} required>
                <option value="">Select property</option>
                {workspace.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <select value={tenantForm.unitId} onChange={(event) => setTenantForm({ ...tenantForm, unitId: event.target.value })} required>
                <option value="">Assign unit</option>
                {tenantUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label} | {unit.propertyName}
                  </option>
                ))}
              </select>
              <input placeholder="Full legal name" value={tenantForm.name} onChange={(event) => setTenantForm({ ...tenantForm, name: event.target.value })} required />
              <input placeholder="Preferred name" value={tenantForm.preferredName} onChange={(event) => setTenantForm({ ...tenantForm, preferredName: event.target.value })} />
              <input type="email" placeholder="Email" value={tenantForm.email} onChange={(event) => setTenantForm({ ...tenantForm, email: event.target.value })} />
              <input placeholder="Phone" value={tenantForm.phone} onChange={(event) => setTenantForm({ ...tenantForm, phone: event.target.value })} />
              <input placeholder="Alternate phone" value={tenantForm.alternatePhone} onChange={(event) => setTenantForm({ ...tenantForm, alternatePhone: event.target.value })} />
              <select value={tenantForm.policeVerificationStatus} onChange={(event) => setTenantForm({ ...tenantForm, policeVerificationStatus: event.target.value })}>
                <option value="pending">Police verification pending</option>
                <option value="verified">Verified</option>
                <option value="failed">Failed</option>
                <option value="waived">Waived</option>
              </select>
              <input placeholder="Government ID type" value={tenantForm.governmentIdType} onChange={(event) => setTenantForm({ ...tenantForm, governmentIdType: event.target.value })} />
              <input placeholder="Government ID number" value={tenantForm.governmentIdNumber} onChange={(event) => setTenantForm({ ...tenantForm, governmentIdNumber: event.target.value })} />
              <input type="date" value={tenantForm.leaseEnd} onChange={(event) => setTenantForm({ ...tenantForm, leaseEnd: event.target.value })} />
              <input placeholder="Emergency contact name" value={tenantForm.emergencyContactName} onChange={(event) => setTenantForm({ ...tenantForm, emergencyContactName: event.target.value })} />
              <input placeholder="Emergency contact phone" value={tenantForm.emergencyContactPhone} onChange={(event) => setTenantForm({ ...tenantForm, emergencyContactPhone: event.target.value })} />
              <textarea className="span-2" placeholder="Permanent address" value={tenantForm.permanentAddress} onChange={(event) => setTenantForm({ ...tenantForm, permanentAddress: event.target.value })} rows={2} />
              <textarea className="span-2" placeholder="Tenant notes" value={tenantForm.notes} onChange={(event) => setTenantForm({ ...tenantForm, notes: event.target.value })} rows={3} />
              <button className="primary-action span-2" type="submit" disabled={submitting === "tenant"}>
                {submitting === "tenant" ? "Saving tenant..." : "Save tenant"}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h3>Create Lease</h3>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleLeaseSubmit}>
              <select value={leaseForm.propertyId} onChange={(event) => setLeaseForm({ ...leaseForm, propertyId: event.target.value, unitId: "", tenantId: "" })} required>
                <option value="">Select property</option>
                {workspace.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              <select value={leaseForm.unitId} onChange={(event) => setLeaseForm({ ...leaseForm, unitId: event.target.value })} required>
                <option value="">Select unit</option>
                {leaseUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label} | {unit.propertyName}
                  </option>
                ))}
              </select>
              <select value={leaseForm.tenantId} onChange={(event) => setLeaseForm({ ...leaseForm, tenantId: event.target.value })} required>
                <option value="">Select tenant</option>
                {workspace.tenants
                  .filter((tenant) => !leaseForm.propertyId || tenant.propertyId === leaseForm.propertyId)
                  .map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} | {tenant.propertyName}
                    </option>
                  ))}
              </select>
              <select value={leaseForm.status} onChange={(event) => setLeaseForm({ ...leaseForm, status: event.target.value })}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
              <input type="date" value={leaseForm.startDate} onChange={(event) => setLeaseForm({ ...leaseForm, startDate: event.target.value })} required />
              <input type="date" value={leaseForm.endDate} onChange={(event) => setLeaseForm({ ...leaseForm, endDate: event.target.value })} required />
              <input type="date" value={leaseForm.moveInDate} onChange={(event) => setLeaseForm({ ...leaseForm, moveInDate: event.target.value })} />
              <input type="number" min="0" placeholder="Monthly rent" value={leaseForm.monthlyRent} onChange={(event) => setLeaseForm({ ...leaseForm, monthlyRent: event.target.value })} required />
              <input type="number" min="0" placeholder="Security deposit" value={leaseForm.securityDeposit} onChange={(event) => setLeaseForm({ ...leaseForm, securityDeposit: event.target.value })} required />
              <input type="number" min="1" max="31" placeholder="Rent due day" value={leaseForm.rentDueDay} onChange={(event) => setLeaseForm({ ...leaseForm, rentDueDay: event.target.value })} />
              <input type="date" value={leaseForm.depositReceivedDate} onChange={(event) => setLeaseForm({ ...leaseForm, depositReceivedDate: event.target.value })} />
              <input placeholder="Late fee type" value={leaseForm.lateFeeType} onChange={(event) => setLeaseForm({ ...leaseForm, lateFeeType: event.target.value })} />
              <input type="number" min="0" placeholder="Late fee amount" value={leaseForm.lateFeeAmount} onChange={(event) => setLeaseForm({ ...leaseForm, lateFeeAmount: event.target.value })} />
              <select value={leaseForm.billingFrequency} onChange={(event) => setLeaseForm({ ...leaseForm, billingFrequency: event.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
              <select value={leaseForm.renewalStatus} onChange={(event) => setLeaseForm({ ...leaseForm, renewalStatus: event.target.value })}>
                <option value="fixed_term">Fixed term</option>
                <option value="month_to_month">Month to month</option>
                <option value="renewal_in_progress">Renewal in progress</option>
              </select>
              <input type="number" min="0" placeholder="Notice period days" value={leaseForm.noticePeriodDays} onChange={(event) => setLeaseForm({ ...leaseForm, noticePeriodDays: event.target.value })} />
              <input className="span-2" placeholder="Utility responsibility" value={leaseForm.utilityResponsibility} onChange={(event) => setLeaseForm({ ...leaseForm, utilityResponsibility: event.target.value })} />
              <textarea placeholder="Pet terms" value={leaseForm.petTerms} onChange={(event) => setLeaseForm({ ...leaseForm, petTerms: event.target.value })} rows={2} />
              <textarea placeholder="Parking terms" value={leaseForm.parkingTerms} onChange={(event) => setLeaseForm({ ...leaseForm, parkingTerms: event.target.value })} rows={2} />
              <textarea className="span-2" placeholder="Lease notes" value={leaseForm.notes} onChange={(event) => setLeaseForm({ ...leaseForm, notes: event.target.value })} rows={3} />
              <button className="primary-action span-2" type="submit" disabled={submitting === "lease"}>
                {submitting === "lease" ? "Saving lease..." : "Save lease"}
              </button>
            </form>
          </section>

          <section className="panel panel-wide">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Step 5</p>
                <h3>Upload Tenant Or Lease Document</h3>
              </div>
            </div>
            <form className="form-grid" onSubmit={handleDocumentSubmit}>
              <select
                value={documentForm.entityType}
                onChange={(event) =>
                  setDocumentForm({
                    ...documentForm,
                    entityType: event.target.value,
                    entityId: ""
                  })
                }
              >
                <option value="tenant">Tenant document</option>
                <option value="lease">Lease document</option>
              </select>
              <select value={documentForm.entityId} onChange={(event) => setDocumentForm({ ...documentForm, entityId: event.target.value })} required>
                <option value="">Choose record</option>
                {entityOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {documentForm.entityType === "tenant"
                      ? `${item.name} | ${item.propertyName} ${item.unitLabel}`
                      : `${item.tenantName} | ${item.propertyName} ${item.unitLabel}`}
                  </option>
                ))}
              </select>
              <input placeholder="Document title" value={documentForm.title} onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })} required />
              <select value={documentForm.documentType} onChange={(event) => setDocumentForm({ ...documentForm, documentType: event.target.value })}>
                <option value="government_id_front">Government ID front</option>
                <option value="government_id_back">Government ID back</option>
                <option value="police_verification">Police verification</option>
                <option value="address_proof">Address proof</option>
                <option value="lease_signed">Signed lease</option>
                <option value="lease_addendum">Lease addendum</option>
                <option value="move_in_checklist">Move-in checklist</option>
                <option value="deposit_receipt">Deposit receipt</option>
                <option value="other">Other</option>
              </select>
              <input className="span-2" type="file" onChange={(event) => setDocumentForm({ ...documentForm, file: event.target.files?.[0] || null })} required />
              <button className="primary-action span-2" type="submit" disabled={submitting === "document"}>
                {submitting === "document" ? "Uploading..." : "Upload document"}
              </button>
            </form>
          </section>
        </section>

        <section className="content-grid management-content">
          <section className="panel panel-large">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h3>Properties And Units</h3>
              </div>
            </div>
            <div className="property-list">
              {workspace.properties.map((property) => (
                <article key={property.id} className="property-card selected">
                  <div className="property-top">
                    <div>
                      <div className="property-name">{property.name}</div>
                      <p className="detail-subtext">{property.address}</p>
                    </div>
                    <StatusPill value={`${property.units.length} units`} tone="occupied" />
                  </div>
                  <div className="sub-grid">
                    {property.units.map((unit) => (
                      <div className="mini-card" key={unit.id}>
                        <div className="mini-card-top">
                          <strong>{unit.label}</strong>
                          <StatusPill value={unit.status} />
                        </div>
                        <p className="detail-subtext">
                          {unit.beds} bed | {unit.baths} bath | {unit.rentFormatted}
                        </p>
                        <p className="tenant-meta">{unit.tenantName || `Available ${unit.availableFrom}`}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Tenants</p>
                <h3>KYC And Residency</h3>
              </div>
            </div>
            <div className="list-stack">
              {workspace.tenants.map((tenant) => (
                <article className="list-item stacked-item" key={tenant.id}>
                  <div>
                    <div className="tenant-name">{tenant.name}</div>
                    <p className="tenant-meta">
                      {tenant.propertyName} | Unit {tenant.unitLabel}
                    </p>
                    <p className="tenant-meta">
                      {tenant.governmentIdType || "ID pending"} | Police {tenant.policeVerificationStatus}
                    </p>
                  </div>
                  <div>
                    <div className="amount">{tenant.documentCount} docs</div>
                    <p className="tenant-meta">Lease ends {tenant.leaseEndLabel}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Leases</p>
                <h3>Active Agreements</h3>
              </div>
            </div>
            <div className="list-stack">
              {workspace.leases.map((lease) => (
                <article className="list-item stacked-item" key={lease.id}>
                  <div>
                    <div className="tenant-name">{lease.tenantName}</div>
                    <p className="tenant-meta">
                      {lease.propertyName} | Unit {lease.unitLabel}
                    </p>
                    <p className="tenant-meta">
                      {lease.startDateLabel} to {lease.endDateLabel}
                    </p>
                  </div>
                  <div>
                    <div className="amount">{lease.monthlyRentFormatted}</div>
                    <StatusPill value={lease.status} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Documents</p>
                <h3>Stored Files</h3>
              </div>
            </div>
            <div className="list-stack">
              {workspace.documents.length ? (
                workspace.documents.map((document) => (
                  <article className="list-item stacked-item" key={document.id}>
                    <div>
                      <div className="tenant-name">{document.title}</div>
                      <p className="tenant-meta">
                        {document.entityLabel} | {document.documentType}
                      </p>
                      <p className="tenant-meta">{document.fileName}</p>
                    </div>
                    <div className="doc-actions">
                      <p className="tenant-meta">{document.uploadedAtLabel}</p>
                      <a className="ghost-link" href={`${API_URL}${document.downloadPath}`} target="_blank" rel="noreferrer">
                        Download
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <p className="detail-subtext">No files uploaded yet. This is where signed leases and KYC documents will show up.</p>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
