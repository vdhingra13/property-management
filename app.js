const STORAGE_KEY = "harbor-pm-state";

const defaultData = {
  properties: [
    {
      id: "prop-101",
      name: "North Harbor Residences",
      address: "15 Riverfront Ave",
      city: "Chicago, IL",
      units: [
        { id: "u-101", label: "1A", status: "occupied", rent: 2100, tenantId: "t-101", beds: 2, baths: 2 },
        { id: "u-102", label: "2C", status: "occupied", rent: 1950, tenantId: "t-102", beds: 2, baths: 1 },
        { id: "u-103", label: "3B", status: "notice", rent: 2200, tenantId: "t-103", beds: 2, baths: 2 },
        { id: "u-104", label: "4D", status: "vacant", rent: 2050, tenantId: null, beds: 1, baths: 1 }
      ]
    },
    {
      id: "prop-102",
      name: "Maple Court",
      address: "2908 Wabash Street",
      city: "Indianapolis, IN",
      units: [
        { id: "u-201", label: "101", status: "occupied", rent: 1450, tenantId: "t-201", beds: 1, baths: 1 },
        { id: "u-202", label: "102", status: "occupied", rent: 1475, tenantId: "t-202", beds: 1, baths: 1 },
        { id: "u-203", label: "201", status: "occupied", rent: 1525, tenantId: "t-203", beds: 2, baths: 1 },
        { id: "u-204", label: "202", status: "occupied", rent: 1550, tenantId: "t-204", beds: 2, baths: 2 }
      ]
    },
    {
      id: "prop-103",
      name: "Sage Hill Lofts",
      address: "87 Oakline Blvd",
      city: "Austin, TX",
      units: [
        { id: "u-301", label: "5A", status: "occupied", rent: 2650, tenantId: "t-301", beds: 2, baths: 2 },
        { id: "u-302", label: "5B", status: "occupied", rent: 2590, tenantId: "t-302", beds: 2, baths: 2 },
        { id: "u-303", label: "6A", status: "vacant", rent: 3100, tenantId: null, beds: 3, baths: 2 },
        { id: "u-304", label: "6B", status: "vacant", rent: 3050, tenantId: null, beds: 3, baths: 2 }
      ]
    }
  ],
  tenants: [
    { id: "t-101", name: "Lena Morales", propertyId: "prop-101", unitId: "u-101", leaseEnd: "2026-11-30", balance: 0 },
    { id: "t-102", name: "Jordan Lee", propertyId: "prop-101", unitId: "u-102", leaseEnd: "2026-08-15", balance: 420 },
    { id: "t-103", name: "Mina Patel", propertyId: "prop-101", unitId: "u-103", leaseEnd: "2026-05-31", balance: 0 },
    { id: "t-201", name: "Theo Grant", propertyId: "prop-102", unitId: "u-201", leaseEnd: "2027-01-31", balance: 0 },
    { id: "t-202", name: "Maya Ross", propertyId: "prop-102", unitId: "u-202", leaseEnd: "2026-12-31", balance: 0 },
    { id: "t-203", name: "Chris Vaughn", propertyId: "prop-102", unitId: "u-203", leaseEnd: "2026-09-30", balance: 0 },
    { id: "t-204", name: "Amara Cole", propertyId: "prop-102", unitId: "u-204", leaseEnd: "2026-10-15", balance: 175 },
    { id: "t-301", name: "Diego Alvarez", propertyId: "prop-103", unitId: "u-301", leaseEnd: "2026-07-31", balance: 0 },
    { id: "t-302", name: "Sofia Bennett", propertyId: "prop-103", unitId: "u-302", leaseEnd: "2026-06-30", balance: 0 }
  ],
  payments: [
    { id: "pay-1", tenantId: "t-101", status: "paid", amount: 2100, dueDate: "2026-04-01" },
    { id: "pay-2", tenantId: "t-102", status: "partial", amount: 1530, dueDate: "2026-04-01" },
    { id: "pay-3", tenantId: "t-103", status: "paid", amount: 2200, dueDate: "2026-04-01" },
    { id: "pay-4", tenantId: "t-201", status: "paid", amount: 1450, dueDate: "2026-04-01" },
    { id: "pay-5", tenantId: "t-202", status: "paid", amount: 1475, dueDate: "2026-04-01" },
    { id: "pay-6", tenantId: "t-203", status: "paid", amount: 1525, dueDate: "2026-04-01" },
    { id: "pay-7", tenantId: "t-204", status: "overdue", amount: 1375, dueDate: "2026-04-01" },
    { id: "pay-8", tenantId: "t-301", status: "paid", amount: 2650, dueDate: "2026-04-01" },
    { id: "pay-9", tenantId: "t-302", status: "paid", amount: 2590, dueDate: "2026-04-01" }
  ],
  maintenance: [
    { id: "m-101", propertyId: "prop-101", title: "Lobby intercom offline", priority: "high", status: "Open", unit: "Common Area" },
    { id: "m-102", propertyId: "prop-101", title: "Dishwasher leak", priority: "medium", status: "Awaiting vendor", unit: "2C" },
    { id: "m-103", propertyId: "prop-102", title: "Hallway paint touch-up", priority: "low", status: "Scheduled", unit: "2nd Floor" },
    { id: "m-104", propertyId: "prop-103", title: "HVAC inspection", priority: "high", status: "Open", unit: "6B" }
  ]
};

const state = {
  activeSection: "overview",
  selectedPropertyId: "prop-101",
  statusFilter: "all",
  searchQuery: "",
  data: loadStoredData()
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const metricsGrid = document.getElementById("metrics-grid");
const propertyList = document.getElementById("property-list");
const selectedPropertyTitle = document.getElementById("selected-property-title");
const selectedPropertyMeta = document.getElementById("selected-property-meta");
const selectedPropertyDetail = document.getElementById("selected-property-detail");
const paymentList = document.getElementById("payment-list");
const maintenanceList = document.getElementById("maintenance-list");
const portfolioSummary = document.getElementById("portfolio-summary");
const rentSummary = document.getElementById("rent-summary");
const maintenanceSummary = document.getElementById("maintenance-summary");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const entryType = document.getElementById("entry-type");
const entryName = document.getElementById("entry-name");
const entryProperty = document.getElementById("entry-property");
const entryDetail = document.getElementById("entry-detail");
const quickAddForm = document.getElementById("quick-add-form");
const headlineCollectionRate = document.getElementById("headline-collection-rate");
const headlineCollectionText = document.getElementById("headline-collection-text");

function initialize() {
  populatePropertyChoices();
  attachEvents();
  render();
}

function loadStoredData() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function persistData() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function attachEvents() {
  searchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    render();
  });

  statusFilter.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    render();
  });

  entryType.addEventListener("change", () => {
    const isTenant = entryType.value === "tenant";
    entryDetail.previousElementSibling.textContent = isTenant ? "Unit" : "Priority";
    entryDetail.placeholder = isTenant ? "Unit 3B" : "high";
  });

  quickAddForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (entryType.value === "tenant") {
      addTenantEntry();
    } else {
      addMaintenanceEntry();
    }
    quickAddForm.reset();
    entryDetail.previousElementSibling.textContent = "Unit";
    entryDetail.placeholder = "Unit 3B";
    render();
  });

  document.querySelectorAll(".nav-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSection = button.dataset.section;
      document.querySelectorAll(".nav-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
      render();
    });
  });
}

function populatePropertyChoices() {
  entryProperty.innerHTML = state.data.properties
    .map((property) => `<option value="${property.id}">${property.name}</option>`)
    .join("");
}

function addTenantEntry() {
  const property = getPropertyById(entryProperty.value);
  const label = entryDetail.value.trim();
  const tenantName = entryName.value.trim();
  if (!property || !tenantName || !label) {
    return;
  }

  const unitId = `u-${Date.now()}`;
  const tenantId = `t-${Date.now()}`;
  const estimatedRent = 1800;

  property.units.push({
    id: unitId,
    label,
    status: "occupied",
    rent: estimatedRent,
    tenantId,
    beds: 2,
    baths: 1
  });

  state.data.tenants.unshift({
    id: tenantId,
    name: tenantName,
    propertyId: property.id,
    unitId,
    leaseEnd: "2027-03-31",
    balance: 0
  });

  state.data.payments.unshift({
    id: `pay-${Date.now()}`,
    tenantId,
    status: "paid",
    amount: estimatedRent,
    dueDate: "2026-04-01"
  });

  state.selectedPropertyId = property.id;
  persistData();
}

function addMaintenanceEntry() {
  const property = getPropertyById(entryProperty.value);
  const priority = entryDetail.value.trim().toLowerCase() || "medium";
  const title = entryName.value.trim();
  if (!property || !title) {
    return;
  }

  state.data.maintenance.unshift({
    id: `m-${Date.now()}`,
    propertyId: property.id,
    title,
    priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
    status: "Open",
    unit: "To assign"
  });

  state.selectedPropertyId = property.id;
  persistData();
}

function getPropertyById(propertyId) {
  return state.data.properties.find((property) => property.id === propertyId);
}

function getTenantById(tenantId) {
  return state.data.tenants.find((tenant) => tenant.id === tenantId);
}

function getVisibleProperties() {
  return state.data.properties.filter((property) => {
    const matchesSearch = !state.searchQuery || [
      property.name,
      property.address,
      property.city,
      ...property.units.map((unit) => unit.label),
      ...property.units.map((unit) => getTenantById(unit.tenantId)?.name || "")
    ].some((value) => value.toLowerCase().includes(state.searchQuery));

    const matchesStatus = state.statusFilter === "all" || property.units.some((unit) => unit.status === state.statusFilter);
    const matchesSection = filterBySection(property);
    return matchesSearch && matchesStatus && matchesSection;
  });
}

function filterBySection(property) {
  if (state.activeSection === "operations") {
    return state.data.maintenance.some((request) => request.propertyId === property.id);
  }
  return true;
}

function calculateMetrics() {
  const properties = state.data.properties;
  const allUnits = properties.flatMap((property) => property.units);
  const occupiedUnits = allUnits.filter((unit) => unit.status === "occupied").length;
  const vacantUnits = allUnits.filter((unit) => unit.status === "vacant").length;
  const noticeUnits = allUnits.filter((unit) => unit.status === "notice").length;
  const totalRevenue = properties.reduce((sum, property) => sum + calculatePropertyRevenue(property), 0);
  const collected = state.data.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const scheduled = allUnits
    .filter((unit) => unit.status !== "vacant")
    .reduce((sum, unit) => sum + unit.rent, 0);
  const collectionRate = scheduled ? Math.round((collected / scheduled) * 100) : 0;

  return {
    propertyCount: properties.length,
    occupiedUnits,
    vacantUnits,
    noticeUnits,
    totalUnits: allUnits.length,
    totalRevenue,
    collectionRate
  };
}

function calculatePropertyOccupancy(property) {
  const occupiedOrNotice = property.units.filter((unit) => unit.status === "occupied" || unit.status === "notice").length;
  return property.units.length ? occupiedOrNotice / property.units.length : 0;
}

function calculatePropertyRevenue(property) {
  return property.units.reduce((sum, unit) => sum + unit.rent, 0);
}

function renderMetrics() {
  const metrics = calculateMetrics();
  const cards = [
    { label: "Properties", value: String(metrics.propertyCount), meta: `${metrics.totalUnits} total units under management` },
    { label: "Occupied Units", value: `${metrics.occupiedUnits}/${metrics.totalUnits}`, meta: `${Math.round((metrics.occupiedUnits / metrics.totalUnits) * 100)}% currently leased` },
    { label: "Vacancy Risk", value: `${metrics.vacantUnits + metrics.noticeUnits}`, meta: `${metrics.vacantUnits} vacant, ${metrics.noticeUnits} on notice` },
    { label: "Monthly Revenue", value: currency.format(metrics.totalRevenue), meta: `${metrics.collectionRate}% of scheduled rent collected` }
  ];

  metricsGrid.innerHTML = "";
  const template = document.getElementById("metric-card-template");

  cards.forEach((card, index) => {
    const clone = template.content.cloneNode(true);
    clone.querySelector(".metric-label").textContent = card.label;
    clone.querySelector(".metric-value").textContent = card.value;
    clone.querySelector(".metric-meta").textContent = card.meta;
    clone.querySelector(".metric-card").style.animationDelay = `${index * 0.06}s`;
    metricsGrid.appendChild(clone);
  });

  headlineCollectionRate.textContent = `${metrics.collectionRate}%`;
  headlineCollectionText.textContent = `${metrics.occupiedUnits} occupied units across ${metrics.propertyCount} properties`;
}

function renderProperties() {
  const properties = getVisibleProperties();
  if (!properties.length) {
    propertyList.innerHTML = `<div class="detail-card"><div class="detail-header"><span class="detail-title">No matches</span></div><p class="detail-subtext">Try a broader search or reset the occupancy filter.</p></div>`;
    return;
  }

  if (!properties.some((property) => property.id === state.selectedPropertyId)) {
    state.selectedPropertyId = properties[0].id;
  }

  propertyList.innerHTML = properties.map((property) => {
    const occupiedCount = property.units.filter((unit) => unit.status === "occupied").length;
    const openMaintenance = state.data.maintenance.filter((request) => request.propertyId === property.id).length;
    const occupancy = calculatePropertyOccupancy(property);
    const monthlyRevenue = calculatePropertyRevenue(property);
    return `
      <article class="property-card ${property.id === state.selectedPropertyId ? "selected" : ""}" data-property-id="${property.id}">
        <div class="property-top">
          <div>
            <div class="property-name">${property.name}</div>
            <p class="detail-subtext">${property.address}, ${property.city}</p>
          </div>
          <span class="pill ${occupancy >= 0.95 ? "occupied" : occupancy >= 0.8 ? "notice" : "overdue"}">
            ${Math.round(occupancy * 100)}% occupied
          </span>
        </div>
        <div class="property-bottom">
          <span>${occupiedCount}/${property.units.length} units leased</span>
          <span>${openMaintenance} active requests</span>
          <strong>${currency.format(monthlyRevenue)}</strong>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".property-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedPropertyId = card.dataset.propertyId;
      render();
    });
  });
}

function renderSelectedProperty() {
  const property = getPropertyById(state.selectedPropertyId);
  if (!property) {
    return;
  }

  const openRequests = state.data.maintenance.filter((request) => request.propertyId === property.id).length;
  selectedPropertyTitle.textContent = property.name;
  selectedPropertyMeta.textContent = `${property.city} | ${openRequests} active work orders`;
  selectedPropertyDetail.innerHTML = property.units.map((unit) => {
    const tenant = unit.tenantId ? getTenantById(unit.tenantId) : null;
    const leaseText = tenant ? `Lease ends ${formatDate(tenant.leaseEnd)}` : "Ready for listing";
    return `
      <article class="detail-card">
        <div class="detail-header">
          <div>
            <div class="detail-title">Unit ${unit.label}</div>
            <p class="detail-subtext">${unit.beds} bed | ${unit.baths} bath</p>
          </div>
          <span class="pill ${unit.status}">${unit.status}</span>
        </div>
        <div>
          <div class="tenant-name">${tenant ? tenant.name : "Vacant unit"}</div>
          <p class="tenant-meta">${leaseText}</p>
        </div>
        <div class="detail-row">
          <span>Rent</span>
          <span class="amount">${currency.format(unit.rent)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderPayments() {
  const visiblePayments = state.data.payments.slice(0, 6);
  const totalCollected = visiblePayments.reduce((sum, payment) => sum + payment.amount, 0);
  rentSummary.textContent = `${visiblePayments.length} latest entries | ${currency.format(totalCollected)} logged`;

  paymentList.innerHTML = visiblePayments.map((payment) => {
    const tenant = getTenantById(payment.tenantId);
    const property = tenant ? getPropertyById(tenant.propertyId) : null;
    return `
      <article class="list-item">
        <div>
          <div class="tenant-name">${tenant?.name || "Unknown tenant"}</div>
          <p class="tenant-meta">${property?.name || "Unknown property"} | Due ${formatDate(payment.dueDate)}</p>
        </div>
        <div>
          <div class="amount">${currency.format(payment.amount)}</div>
          <span class="pill ${payment.status}">${payment.status}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderMaintenance() {
  const visibleRequests = state.data.maintenance.slice(0, 6);
  const highPriorityCount = state.data.maintenance.filter((request) => request.priority === "high").length;
  maintenanceSummary.textContent = `${highPriorityCount} high priority | ${state.data.maintenance.length} open items`;

  maintenanceList.innerHTML = visibleRequests.map((request) => {
    const property = getPropertyById(request.propertyId);
    return `
      <article class="list-item">
        <div>
          <div class="request-title">${request.title}</div>
          <p class="request-meta">${property?.name || "Unknown property"} | ${request.unit} | ${request.status}</p>
        </div>
        <span class="pill ${request.priority}">${request.priority}</span>
      </article>
    `;
  }).join("");
}

function renderPortfolioSummary() {
  const properties = getVisibleProperties();
  const units = properties.flatMap((property) => property.units);
  const leased = units.filter((unit) => unit.status === "occupied").length;
  portfolioSummary.textContent = `${properties.length} properties shown | ${leased} occupied units`;
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function render() {
  renderMetrics();
  renderPortfolioSummary();
  renderProperties();
  renderSelectedProperty();
  renderPayments();
  renderMaintenance();
}

initialize();
